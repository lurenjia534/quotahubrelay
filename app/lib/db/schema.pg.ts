import { bigint, index, integer, pgTable, text } from "drizzle-orm/pg-core";
import type {
  QuotaSubscription,
  RelayRefreshMode,
} from "@/app/lib/quota/types";

const timestampMillis = (name: string) => bigint(name, { mode: "number" });

export const quotaSubscription = pgTable(
  "quota_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    providerId: text("provider_id").notNull(),
    customTitle: text("custom_title"),
    encryptedCredentials: text("encrypted_credentials").notNull(),
    syncState: text("sync_state")
      .$type<QuotaSubscription["syncState"]>()
      .notNull(),
    lastSyncedAt: timestampMillis("last_synced_at"),
    createdAt: timestampMillis("created_at").notNull(),
    updatedAt: timestampMillis("updated_at").notNull(),
  },
  (table) => [index("quota_subscription_user_id_idx").on(table.userId)],
);

export const quotaSnapshot = pgTable("quota_snapshot", {
  subscriptionId: text("subscription_id")
    .primaryKey()
    .references(() => quotaSubscription.id, { onDelete: "cascade" }),
  fetchedAt: timestampMillis("fetched_at").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  replayPayloadJson: text("replay_payload_json").notNull(),
  updatedAt: timestampMillis("updated_at").notNull(),
});

export const quotaSubscriptionTombstone = pgTable(
  "quota_subscription_tombstone",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    deletedAt: timestampMillis("deleted_at").notNull(),
  },
  (table) => [index("quota_subscription_tombstone_user_id_idx").on(table.userId)],
);

export const quotaClientToken = pgTable(
  "quota_client_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    createdAt: timestampMillis("created_at").notNull(),
    lastUsedAt: timestampMillis("last_used_at"),
  },
  (table) => [index("quota_client_token_user_id_idx").on(table.userId)],
);

export const quotaRelaySettings = pgTable("quota_relay_settings", {
  userId: text("user_id").primaryKey(),
  remoteClientAccessEnabled: integer("remote_client_access_enabled")
    .notNull()
    .default(0),
  refreshMode: text("refresh_mode")
    .$type<RelayRefreshMode>()
    .notNull()
    .default("manual"),
  updatedAt: timestampMillis("updated_at").notNull(),
});
