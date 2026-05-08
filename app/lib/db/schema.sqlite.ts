import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { QuotaSubscription } from "@/app/lib/quota/types";

export const quotaSubscription = sqliteTable(
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
    lastSyncedAt: integer("last_synced_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("quota_subscription_user_id_idx").on(table.userId)],
);

export const quotaSnapshot = sqliteTable("quota_snapshot", {
  subscriptionId: text("subscription_id")
    .primaryKey()
    .references(() => quotaSubscription.id, { onDelete: "cascade" }),
  fetchedAt: integer("fetched_at").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  replayPayloadJson: text("replay_payload_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const quotaSubscriptionTombstone = sqliteTable(
  "quota_subscription_tombstone",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    deletedAt: integer("deleted_at").notNull(),
  },
  (table) => [index("quota_subscription_tombstone_user_id_idx").on(table.userId)],
);

export const quotaClientToken = sqliteTable(
  "quota_client_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    createdAt: integer("created_at").notNull(),
    lastUsedAt: integer("last_used_at"),
  },
  (table) => [index("quota_client_token_user_id_idx").on(table.userId)],
);

export const quotaRelaySettings = sqliteTable("quota_relay_settings", {
  userId: text("user_id").primaryKey(),
  remoteClientAccessEnabled: integer("remote_client_access_enabled")
    .notNull()
    .default(0),
  updatedAt: integer("updated_at").notNull(),
});
