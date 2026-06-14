// Drizzle schema — mirrors Supabase tables + local auth tables.
// Used by drizzle-kit (CLI) and by server code via @/db/client.server.
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  doublePrecision,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------
// Enums
// ---------------------------------------------------------------
export const appRoleEnum = pgEnum('app_role', ['admin', 'moderator', 'user']);

// ---------------------------------------------------------------
// Auth (local, replaces Supabase auth.users)
// ---------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_unique').on(t.email),
  }),
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: appRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqUserRole: uniqueIndex('user_roles_user_id_role_unique').on(t.userId, t.role),
  }),
);

// Optional: server-side sessions (in addition to JWT cookie). Useful for revoke.
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  userAgent: text('user_agent'),
  ip: text('ip'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------
// News + RSS (mirror of Supabase public tables)
// ---------------------------------------------------------------
export const newsArticles = pgTable(
  'news_articles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    link: text('link').notNull(),
    excerpt: text('excerpt'),
    content: text('content'),
    imageUrl: text('image_url'),
    source: text('source'),
    author: text('author'),
    category: text('category'),
    region: text('region'),
    sentiment: text('sentiment'),
    sentimentScore: doublePrecision('sentiment_score'),
    keywords: jsonb('keywords').$type<string[]>().default(sql`'[]'::jsonb`),
    entities: jsonb('entities').default(sql`'{}'::jsonb`),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    feedId: uuid('feed_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    linkUnique: uniqueIndex('news_articles_link_unique').on(t.link),
    publishedIdx: index('news_articles_published_at_idx').on(t.publishedAt),
    categoryIdx: index('news_articles_category_idx').on(t.category),
  }),
);

export const rssFeeds = pgTable('rss_feeds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  url: text('url').notNull(),
  category: text('category'),
  isActive: boolean('is_active').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastError: text('last_error'),
  fetchIntervalMinutes: integer('fetch_interval_minutes').default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const trackedKeywords = pgTable('tracked_keywords', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyword: text('keyword').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const keywordQueries = pgTable('keyword_queries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  resultCount: integer('result_count').default(0),
  filters: jsonb('filters').default(sql`'{}'::jsonb`),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type RssFeed = typeof rssFeeds.$inferSelect;
