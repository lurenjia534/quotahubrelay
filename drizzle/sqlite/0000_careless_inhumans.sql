CREATE TABLE `quota_client_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_prefix` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quota_client_token_token_hash_unique` ON `quota_client_token` (`token_hash`);--> statement-breakpoint
CREATE INDEX `quota_client_token_user_id_idx` ON `quota_client_token` (`user_id`);--> statement-breakpoint
CREATE TABLE `quota_relay_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`remote_client_access_enabled` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quota_snapshot` (
	`subscription_id` text PRIMARY KEY NOT NULL,
	`fetched_at` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`replay_payload_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `quota_subscription`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quota_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`custom_title` text,
	`encrypted_credentials` text NOT NULL,
	`sync_state` text NOT NULL,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quota_subscription_user_id_idx` ON `quota_subscription` (`user_id`);--> statement-breakpoint
CREATE TABLE `quota_subscription_tombstone` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deleted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quota_subscription_tombstone_user_id_idx` ON `quota_subscription_tombstone` (`user_id`);