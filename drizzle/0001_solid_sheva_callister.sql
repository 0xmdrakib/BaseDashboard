CREATE TABLE `saved_funnels` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`steps` text NOT NULL,
	`window_hours` integer NOT NULL,
	`app_id` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
