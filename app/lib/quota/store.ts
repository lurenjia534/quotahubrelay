import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { createHash, randomBytes, randomUUID } from "crypto";
import { quotaDb } from "@/app/lib/db/client";
import * as sqliteSchema from "@/app/lib/db/schema.sqlite";
import { decryptJson, encryptJson } from "@/app/lib/quota/crypto";
import {
  CapturedQuotaSnapshot,
  DeletedQuotaSubscription,
  QuotaSnapshot,
  QuotaSubscription,
  RelaySettings,
  RelayClientToken,
  SecretBundle,
} from "@/app/lib/quota/types";
import { providerById } from "@/app/lib/quota/providers";

type SubscriptionRow = {
  id: string;
  userId: string;
  providerId: string;
  customTitle: string | null;
  encryptedCredentials: string;
  syncState: QuotaSubscription["syncState"];
  lastSyncedAt: number | null;
  createdAt: number;
  updatedAt: number;
  snapshotJson?: string | null;
};

type ClientTokenRow = {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  createdAt: number;
  lastUsedAt: number | null;
};

type DeletedSubscriptionRow = {
  id: string;
  userId: string;
  deletedAt: number;
};

type RelaySettingsRow = {
  userId: string;
  remoteClientAccessEnabled: boolean | number;
  updatedAt: number;
};

type QuotaStoreDb = BetterSQLite3Database<typeof sqliteSchema>;

const db = quotaDb.db as unknown as QuotaStoreDb;
const schema = quotaDb.schema as typeof sqliteSchema;

export async function listSubscriptions(userId: string) {
  const rows = await selectSubscriptionRows(
    eq(schema.quotaSubscription.userId, userId),
  );
  return rows.map(rowToSubscription);
}

export async function listDeletedSubscriptions(
  userId: string,
  deletedSince?: number,
): Promise<DeletedQuotaSubscription[]> {
  const rows = (await db
    .select()
    .from(schema.quotaSubscriptionTombstone)
    .where(
      and(
        eq(schema.quotaSubscriptionTombstone.userId, userId),
        gt(schema.quotaSubscriptionTombstone.deletedAt, deletedSince ?? 0),
      ),
    )
    .orderBy(desc(schema.quotaSubscriptionTombstone.deletedAt))) as
    | DeletedSubscriptionRow[]
    | Promise<DeletedSubscriptionRow[]>;

  return (await rows).map(rowToDeletedSubscription);
}

export async function getSubscription(userId: string, id: string) {
  const rows = await selectSubscriptionRows(
    and(eq(schema.quotaSubscription.userId, userId), eq(schema.quotaSubscription.id, id)),
  );
  return rows[0] ? rowToSubscription(rows[0]) : null;
}

export async function getSubscriptionCredentials(userId: string, id: string) {
  const row = await getSubscriptionRow(userId, id);
  if (!row) return null;

  return {
    subscription: rowToSubscription(row),
    credentials: decryptJson<SecretBundle>(row.encryptedCredentials),
  };
}

export async function createSubscription(input: {
  userId: string;
  providerId: string;
  customTitle: string | null;
  credentials: SecretBundle;
  capturedSnapshot: CapturedQuotaSnapshot;
}) {
  const id = randomUUID();
  const now = Date.now();
  await db.insert(schema.quotaSubscription).values({
    id,
    userId: input.userId,
    providerId: input.providerId,
    customTitle: input.customTitle,
    encryptedCredentials: encryptJson(input.credentials),
    syncState: "active",
    lastSyncedAt: input.capturedSnapshot.snapshot.fetchedAt,
    createdAt: now,
    updatedAt: now,
  });
  await upsertSnapshot(id, input.capturedSnapshot);

  return getSubscription(input.userId, id);
}

export async function updateSubscriptionSnapshot(
  userId: string,
  id: string,
  capturedSnapshot: CapturedQuotaSnapshot,
) {
  await db
    .update(schema.quotaSubscription)
    .set({
      syncState: "active",
      lastSyncedAt: capturedSnapshot.snapshot.fetchedAt,
      updatedAt: Date.now(),
    })
    .where(and(eq(schema.quotaSubscription.userId, userId), eq(schema.quotaSubscription.id, id)));
  await upsertSnapshot(id, capturedSnapshot);

  return getSubscription(userId, id);
}

export async function markSubscriptionSyncError(
  userId: string,
  id: string,
  syncState: "auth_failed" | "sync_error",
) {
  await db
    .update(schema.quotaSubscription)
    .set({ syncState, updatedAt: Date.now() })
    .where(and(eq(schema.quotaSubscription.userId, userId), eq(schema.quotaSubscription.id, id)));
}

export async function deleteSubscription(userId: string, id: string) {
  const existing = await getSubscription(userId, id);
  if (!existing) return false;
  await upsertSubscriptionTombstone(userId, id);
  await db
    .delete(schema.quotaSnapshot)
    .where(eq(schema.quotaSnapshot.subscriptionId, id));
  await db
    .delete(schema.quotaSubscription)
    .where(and(eq(schema.quotaSubscription.userId, userId), eq(schema.quotaSubscription.id, id)));
  return true;
}

async function upsertSubscriptionTombstone(userId: string, id: string) {
  await db
    .insert(schema.quotaSubscriptionTombstone)
    .values({ id, userId, deletedAt: Date.now() })
    .onConflictDoUpdate({
      target: schema.quotaSubscriptionTombstone.id,
      set: {
        userId,
        deletedAt: Date.now(),
      },
    });
}

export async function listClientTokens(userId: string): Promise<RelayClientToken[]> {
  const rows = (await db
    .select()
    .from(schema.quotaClientToken)
    .where(eq(schema.quotaClientToken.userId, userId))
    .orderBy(desc(schema.quotaClientToken.createdAt))) as
    | ClientTokenRow[]
    | Promise<ClientTokenRow[]>;
  return (await rows).map(rowToClientToken);
}

export async function getRelaySettings(userId: string): Promise<RelaySettings> {
  const rows = (await db
    .select()
    .from(schema.quotaRelaySettings)
    .where(eq(schema.quotaRelaySettings.userId, userId))
    .limit(1)) as RelaySettingsRow[] | Promise<RelaySettingsRow[]>;
  const row = (await rows)[0];

  return {
    remoteClientAccessEnabled: Boolean(row?.remoteClientAccessEnabled),
  };
}

export async function updateRelaySettings(
  userId: string,
  settings: RelaySettings,
): Promise<RelaySettings> {
  const now = Date.now();
  await db
    .insert(schema.quotaRelaySettings)
    .values({
      userId,
      remoteClientAccessEnabled: settings.remoteClientAccessEnabled ? 1 : 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.quotaRelaySettings.userId,
      set: {
        remoteClientAccessEnabled: settings.remoteClientAccessEnabled ? 1 : 0,
        updatedAt: now,
      },
    });

  return getRelaySettings(userId);
}

export async function createClientToken(userId: string, name: string) {
  const token = `qhr_${randomBytes(32).toString("base64url")}`;
  const id = randomUUID();
  const now = Date.now();
  await db.insert(schema.quotaClientToken).values({
    id,
    userId,
    name,
    tokenHash: tokenHash(token),
    tokenPrefix: token.slice(0, 12),
    createdAt: now,
    lastUsedAt: null,
  });

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
  const rows = (await db
    .select({ id: schema.quotaClientToken.id })
    .from(schema.quotaClientToken)
    .where(and(eq(schema.quotaClientToken.userId, userId), eq(schema.quotaClientToken.id, id)))
    .limit(1)) as { id: string }[] | Promise<{ id: string }[]>;
  if (!(await rows)[0]) return false;

  await db
    .delete(schema.quotaClientToken)
    .where(and(eq(schema.quotaClientToken.userId, userId), eq(schema.quotaClientToken.id, id)));
  return true;
}

export async function findClientTokenAuth(token: string) {
  const rows = (await db
    .select()
    .from(schema.quotaClientToken)
    .where(eq(schema.quotaClientToken.tokenHash, tokenHash(token)))
    .limit(1)) as ClientTokenRow[] | Promise<ClientTokenRow[]>;
  const row = (await rows)[0];
  if (!row) return null;

  return {
    tokenId: row.id,
    userId: row.userId,
  };
}

export async function markClientTokenUsed(tokenId: string) {
  await db
    .update(schema.quotaClientToken)
    .set({ lastUsedAt: Date.now() })
    .where(eq(schema.quotaClientToken.id, tokenId));
}

async function upsertSnapshot(
  subscriptionId: string,
  capturedSnapshot: CapturedQuotaSnapshot,
) {
  const now = Date.now();
  await db
    .insert(schema.quotaSnapshot)
    .values({
      subscriptionId,
      fetchedAt: capturedSnapshot.snapshot.fetchedAt,
      snapshotJson: JSON.stringify(capturedSnapshot.snapshot),
      replayPayloadJson: JSON.stringify(capturedSnapshot.replayPayload),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.quotaSnapshot.subscriptionId,
      set: {
        fetchedAt: capturedSnapshot.snapshot.fetchedAt,
        snapshotJson: JSON.stringify(capturedSnapshot.snapshot),
        replayPayloadJson: JSON.stringify(capturedSnapshot.replayPayload),
        updatedAt: now,
      },
    });
}

async function selectSubscriptionRows(where: SQL | undefined) {
  const rows = (await db
    .select({
      id: schema.quotaSubscription.id,
      userId: schema.quotaSubscription.userId,
      providerId: schema.quotaSubscription.providerId,
      customTitle: schema.quotaSubscription.customTitle,
      encryptedCredentials: schema.quotaSubscription.encryptedCredentials,
      syncState: schema.quotaSubscription.syncState,
      lastSyncedAt: schema.quotaSubscription.lastSyncedAt,
      createdAt: schema.quotaSubscription.createdAt,
      updatedAt: schema.quotaSubscription.updatedAt,
      snapshotJson: schema.quotaSnapshot.snapshotJson,
    })
    .from(schema.quotaSubscription)
    .leftJoin(
      schema.quotaSnapshot,
      eq(schema.quotaSnapshot.subscriptionId, schema.quotaSubscription.id),
    )
    .where(where)
    .orderBy(desc(schema.quotaSubscription.createdAt))) as
    | SubscriptionRow[]
    | Promise<SubscriptionRow[]>;

  return rows;
}

async function getSubscriptionRow(userId: string, id: string) {
  const rows = (await db
    .select()
    .from(schema.quotaSubscription)
    .where(and(eq(schema.quotaSubscription.userId, userId), eq(schema.quotaSubscription.id, id)))
    .limit(1)) as SubscriptionRow[] | Promise<SubscriptionRow[]>;

  return (await rows)[0] ?? null;
}

function rowToSubscription(row: SubscriptionRow): QuotaSubscription {
  const provider = providerById(row.providerId);
  const providerDisplayName = provider?.descriptor.displayName ?? row.providerId;
  return {
    id: row.id,
    userId: row.userId,
    providerId: row.providerId,
    providerDisplayName,
    customTitle: row.customTitle,
    displayTitle:
      row.customTitle?.trim() || `${providerDisplayName} #${row.id.slice(0, 8)}`,
    syncState: row.syncState,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    snapshot: row.snapshotJson
      ? (JSON.parse(row.snapshotJson) as QuotaSnapshot)
      : null,
  };
}

function rowToClientToken(row: ClientTokenRow): RelayClientToken {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}

function rowToDeletedSubscription(
  row: DeletedSubscriptionRow,
): DeletedQuotaSubscription {
  return {
    id: row.id,
    deletedAt: row.deletedAt,
  };
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
