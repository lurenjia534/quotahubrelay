import "server-only";

import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID } from "crypto";
import { Pool, QueryResultRow } from "pg";
import { decryptJson, encryptJson } from "@/app/lib/quota/crypto";
import {
  CapturedQuotaSnapshot,
  QuotaSnapshot,
  QuotaSubscription,
  RelaySettings,
  RelayClientToken,
  SecretBundle,
} from "@/app/lib/quota/types";
import { providerById } from "@/app/lib/quota/providers";

type SubscriptionRow = {
  id: string;
  user_id: string;
  provider_id: string;
  custom_title: string | null;
  encrypted_credentials: string;
  sync_state: QuotaSubscription["syncState"];
  last_synced_at: number | null;
  created_at: number;
  updated_at: number;
  snapshot_json?: string | null;
};

type ClientTokenRow = {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  token_prefix: string;
  created_at: number;
  last_used_at: number | null;
};

type RelaySettingsRow = {
  user_id: string;
  remote_client_access_enabled: boolean | number;
  updated_at: number;
};

const sqlite = process.env.DATABASE_URL
  ? null
  : new Database(process.env.SQLITE_DATABASE_PATH || "auth.sqlite");
const pgPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

let schemaReady = false;

export async function listSubscriptions(userId: string) {
  await ensureQuotaSchema();
  const rows = await allRows<SubscriptionRow>(
    `select s.*, q.snapshot_json
       from quota_subscription s
       left join quota_snapshot q on q.subscription_id = s.id
      where s.user_id = $1
      order by s.created_at desc`,
    [userId],
  );
  return rows.map(rowToSubscription);
}

export async function getSubscription(userId: string, id: string) {
  await ensureQuotaSchema();
  const row = await getRow<SubscriptionRow>(
    `select s.*, q.snapshot_json
       from quota_subscription s
       left join quota_snapshot q on q.subscription_id = s.id
      where s.user_id = $1 and s.id = $2`,
    [userId, id],
  );
  return row ? rowToSubscription(row) : null;
}

export async function getSubscriptionCredentials(userId: string, id: string) {
  await ensureQuotaSchema();
  const row = await getRow<SubscriptionRow>(
    "select * from quota_subscription where user_id = $1 and id = $2",
    [userId, id],
  );
  if (!row) return null;

  return {
    subscription: rowToSubscription(row),
    credentials: decryptJson<SecretBundle>(row.encrypted_credentials),
  };
}

export async function createSubscription(input: {
  userId: string;
  providerId: string;
  customTitle: string | null;
  credentials: SecretBundle;
  capturedSnapshot: CapturedQuotaSnapshot;
}) {
  await ensureQuotaSchema();
  const id = randomUUID();
  const now = Date.now();
  await execute(
    `insert into quota_subscription (
       id, user_id, provider_id, custom_title, encrypted_credentials,
       sync_state, last_synced_at, created_at, updated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      input.userId,
      input.providerId,
      input.customTitle,
      encryptJson(input.credentials),
      "active",
      input.capturedSnapshot.snapshot.fetchedAt,
      now,
      now,
    ],
  );
  await upsertSnapshot(id, input.capturedSnapshot);

  return getSubscription(input.userId, id);
}

export async function updateSubscriptionSnapshot(
  userId: string,
  id: string,
  capturedSnapshot: CapturedQuotaSnapshot,
) {
  await ensureQuotaSchema();
  await execute(
    `update quota_subscription
        set sync_state = $1, last_synced_at = $2, updated_at = $3
      where user_id = $4 and id = $5`,
    ["active", capturedSnapshot.snapshot.fetchedAt, Date.now(), userId, id],
  );
  await upsertSnapshot(id, capturedSnapshot);

  return getSubscription(userId, id);
}

export async function markSubscriptionSyncError(
  userId: string,
  id: string,
  syncState: "auth_failed" | "sync_error",
) {
  await ensureQuotaSchema();
  await execute(
    `update quota_subscription
        set sync_state = $1, updated_at = $2
      where user_id = $3 and id = $4`,
    [syncState, Date.now(), userId, id],
  );
}

export async function deleteSubscription(userId: string, id: string) {
  await ensureQuotaSchema();
  const existing = await getSubscription(userId, id);
  if (!existing) return false;
  await execute("delete from quota_snapshot where subscription_id = $1", [id]);
  await execute("delete from quota_subscription where user_id = $1 and id = $2", [
    userId,
    id,
  ]);
  return true;
}

export async function listClientTokens(userId: string): Promise<RelayClientToken[]> {
  await ensureQuotaSchema();
  const rows = await allRows<ClientTokenRow>(
    `select * from quota_client_token
      where user_id = $1
      order by created_at desc`,
    [userId],
  );
  return rows.map(rowToClientToken);
}

export async function getRelaySettings(userId: string): Promise<RelaySettings> {
  await ensureQuotaSchema();
  const row = await getRow<RelaySettingsRow>(
    "select * from quota_relay_settings where user_id = $1",
    [userId],
  );

  return {
    remoteClientAccessEnabled: Boolean(row?.remote_client_access_enabled),
  };
}

export async function updateRelaySettings(
  userId: string,
  settings: RelaySettings,
): Promise<RelaySettings> {
  await ensureQuotaSchema();
  const now = Date.now();
  await execute(
    `insert into quota_relay_settings (
       user_id, remote_client_access_enabled, updated_at
     ) values ($1, $2, $3)
     on conflict (user_id) do update set
       remote_client_access_enabled = excluded.remote_client_access_enabled,
       updated_at = excluded.updated_at`,
    [userId, settings.remoteClientAccessEnabled ? 1 : 0, now],
  );

  return getRelaySettings(userId);
}

export async function createClientToken(userId: string, name: string) {
  await ensureQuotaSchema();
  const token = `qhr_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  const now = Date.now();
  await execute(
    `insert into quota_client_token (
       id, user_id, name, token_hash, token_prefix, created_at, last_used_at
     ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, name, tokenHash(token), token.slice(0, 12), now, null],
  );

  return {
    token,
    clientToken: {
      id,
      name,
      tokenPrefix: token.slice(0, 12),
      createdAt: now,
      lastUsedAt: null,
    } satisfies RelayClientToken,
  };
}

export async function deleteClientToken(userId: string, id: string) {
  await ensureQuotaSchema();
  const existing = await getRow<ClientTokenRow>(
    "select * from quota_client_token where user_id = $1 and id = $2",
    [userId, id],
  );
  if (!existing) return false;
  await execute("delete from quota_client_token where user_id = $1 and id = $2", [
    userId,
    id,
  ]);
  return true;
}

export async function findClientTokenAuth(token: string) {
  await ensureQuotaSchema();
  const row = await getRow<ClientTokenRow>(
    "select * from quota_client_token where token_hash = $1",
    [tokenHash(token)],
  );
  if (!row) return null;

  return {
    tokenId: row.id,
    userId: row.user_id,
  };
}

export async function markClientTokenUsed(tokenId: string) {
  await ensureQuotaSchema();
  await execute("update quota_client_token set last_used_at = $1 where id = $2", [
    Date.now(),
    tokenId,
  ]);
}

async function upsertSnapshot(
  subscriptionId: string,
  capturedSnapshot: CapturedQuotaSnapshot,
) {
  await execute(
    `delete from quota_snapshot where subscription_id = $1`,
    [subscriptionId],
  );
  await execute(
    `insert into quota_snapshot (
       subscription_id, fetched_at, snapshot_json, replay_payload_json, updated_at
     ) values ($1, $2, $3, $4, $5)`,
    [
      subscriptionId,
      capturedSnapshot.snapshot.fetchedAt,
      JSON.stringify(capturedSnapshot.snapshot),
      JSON.stringify(capturedSnapshot.replayPayload),
      Date.now(),
    ],
  );
}

function rowToSubscription(row: SubscriptionRow): QuotaSubscription {
  const provider = providerById(row.provider_id);
  const providerDisplayName = provider?.descriptor.displayName ?? row.provider_id;
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    providerDisplayName,
    customTitle: row.custom_title,
    displayTitle:
      row.custom_title?.trim() || `${providerDisplayName} #${row.id.slice(0, 8)}`,
    syncState: row.sync_state,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    snapshot: row.snapshot_json
      ? (JSON.parse(row.snapshot_json) as QuotaSnapshot)
      : null,
  };
}

function rowToClientToken(row: ClientTokenRow): RelayClientToken {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.token_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

async function ensureQuotaSchema() {
  if (schemaReady) return;
  if (pgPool) {
    await pgPool.query(`
      create table if not exists quota_subscription (
        id text primary key,
        user_id text not null,
        provider_id text not null,
        custom_title text,
        encrypted_credentials text not null,
        sync_state text not null,
        last_synced_at bigint,
        created_at bigint not null,
        updated_at bigint not null
      )
    `);
    await pgPool.query(`
      create table if not exists quota_snapshot (
        subscription_id text primary key references quota_subscription(id) on delete cascade,
        fetched_at bigint not null,
        snapshot_json text not null,
        replay_payload_json text not null,
        updated_at bigint not null
      )
    `);
    await pgPool.query(
      "create index if not exists quota_subscription_user_id_idx on quota_subscription(user_id)",
    );
    await pgPool.query(`
      create table if not exists quota_client_token (
        id text primary key,
        user_id text not null,
        name text not null,
        token_hash text not null unique,
        token_prefix text not null,
        created_at bigint not null,
        last_used_at bigint
      )
    `);
    await pgPool.query(
      "create index if not exists quota_client_token_user_id_idx on quota_client_token(user_id)",
    );
    await pgPool.query(`
      create table if not exists quota_relay_settings (
        user_id text primary key,
        remote_client_access_enabled integer not null default 0,
        updated_at bigint not null
      )
    `);
  } else {
    sqlite
      ?.prepare(
        `create table if not exists quota_subscription (
          id text primary key,
          user_id text not null,
          provider_id text not null,
          custom_title text,
          encrypted_credentials text not null,
          sync_state text not null,
          last_synced_at integer,
          created_at integer not null,
          updated_at integer not null
        )`,
      )
      .run();
    sqlite
      ?.prepare(
        `create table if not exists quota_snapshot (
          subscription_id text primary key,
          fetched_at integer not null,
          snapshot_json text not null,
          replay_payload_json text not null,
          updated_at integer not null,
          foreign key(subscription_id) references quota_subscription(id) on delete cascade
        )`,
      )
      .run();
    sqlite
      ?.prepare(
        "create index if not exists quota_subscription_user_id_idx on quota_subscription(user_id)",
      )
      .run();
    sqlite
      ?.prepare(
        `create table if not exists quota_client_token (
          id text primary key,
          user_id text not null,
          name text not null,
          token_hash text not null unique,
          token_prefix text not null,
          created_at integer not null,
          last_used_at integer
        )`,
      )
      .run();
    sqlite
      ?.prepare(
        "create index if not exists quota_client_token_user_id_idx on quota_client_token(user_id)",
      )
      .run();
    sqlite
      ?.prepare(
        `create table if not exists quota_relay_settings (
          user_id text primary key,
          remote_client_access_enabled integer not null default 0,
          updated_at integer not null
        )`,
      )
      .run();
  }
  schemaReady = true;
}

async function getRow<T extends QueryResultRow>(sql: string, params: unknown[]) {
  if (pgPool) {
    const result = await pgPool.query<T>(sql, params);
    return result.rows[0] ?? null;
  }
  return (sqlite?.prepare(toSqliteSql(sql)).get(params) as T | undefined) ?? null;
}

async function allRows<T extends QueryResultRow>(sql: string, params: unknown[]) {
  if (pgPool) {
    const result = await pgPool.query<T>(sql, params);
    return result.rows;
  }
  return (sqlite?.prepare(toSqliteSql(sql)).all(params) as T[] | undefined) ?? [];
}

async function execute(sql: string, params: unknown[]) {
  if (pgPool) {
    await pgPool.query(sql, params);
    return;
  }
  sqlite?.prepare(toSqliteSql(sql)).run(params);
}

function toSqliteSql(sql: string) {
  return sql.replace(/\$(\d+)/g, "?");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
