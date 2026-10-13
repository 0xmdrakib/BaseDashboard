CREATE TABLE `apps` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`category` text NOT NULL,
	`color` text NOT NULL,
	`chain_id` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`builder_code` text DEFAULT '' NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `query_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`public_key` text DEFAULT '' NOT NULL,
	`region` text DEFAULT 'us' NOT NULL,
	`default_days` integer DEFAULT 30 NOT NULL
);
