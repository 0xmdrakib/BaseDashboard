import { pgTable, text, integer, boolean, bigint, primaryKey } from 'drizzle-orm/pg-core';

export const apps = pgTable('apps', {
  owner: text('owner').notNull(), id: text('id').notNull(), name: text('name').notNull(),
  domain: text('domain').notNull(), category: text('category').notNull(), color: text('color').notNull(),
  chainId: integer('chain_id').notNull(), description: text('description').notNull().default(''),
  builderCode: text('builder_code').notNull().default(''), archived: boolean('archived').notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.id] })]);
export const workspaceSettings = pgTable('workspace_settings', {
  owner: text('owner').primaryKey(), name: text('name').notNull(), projectId: text('project_id').notNull().default(''),
  publicKey: text('public_key').notNull().default(''), region: text('region').notNull().default('us'),
  defaultDays: integer('default_days').notNull().default(30),
});
export const queryCache = pgTable('query_cache', {
  key: text('key').primaryKey(), payload: text('payload').notNull(), expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});
export const savedFunnels = pgTable('saved_funnels', {
  owner: text('owner').notNull(), id: text('id').notNull(), name: text('name').notNull(),
  steps: text('steps').notNull(), windowHours: integer('window_hours').notNull(),
  appId: text('app_id').notNull().default(''), createdAt: text('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.owner, t.id] })]);
