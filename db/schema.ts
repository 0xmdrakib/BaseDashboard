import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const apps = sqliteTable('apps', {
  owner: text('owner').notNull(), id: text('id').notNull(), name: text('name').notNull(),
  domain: text('domain').notNull(), category: text('category').notNull(), color: text('color').notNull(),
  chainId: integer('chain_id').notNull(), description: text('description').notNull().default(''),
  builderCode: text('builder_code').notNull().default(''), archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.id] })]);
export const workspaceSettings = sqliteTable('workspace_settings', {
  owner: text('owner').primaryKey(), name: text('name').notNull(), projectId: text('project_id').notNull().default(''),
  publicKey: text('public_key').notNull().default(''), region: text('region').notNull().default('us'),
  defaultDays: integer('default_days').notNull().default(30),
});
export const queryCache = sqliteTable('query_cache', {
  key: text('key').primaryKey(), payload: text('payload').notNull(), expiresAt: integer('expires_at').notNull(),
});
export const savedFunnels = sqliteTable('saved_funnels', {
  owner: text('owner').notNull(), id: text('id').notNull(), name: text('name').notNull(),
  steps: text('steps').notNull(), windowHours: integer('window_hours').notNull(),
  appId: text('app_id').notNull().default(''), createdAt: text('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.id] })]);
