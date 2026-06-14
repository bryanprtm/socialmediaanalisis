// Drizzle schema — mirrors the existing Postgres tables (Supabase asal)
// plus tabel auth lokal (users, user_roles, sessions).
// Digunakan oleh drizzle-kit (CLI) dan server code via @/db/client.server.
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------
// Enums (match Postgres types yang sudah ada)
// ---------------------------------------------------------------
export const appRoleEnum = pgEnum('app_role', ['admin', 'moderator', 'user']);
export const sentimentTypeEnum = pgEnum('sentiment_type', [
  'positive',
  'negative',
  'neutral',
  'mixed',
]);
export const feedStatusEnum = pgEnum('feed_status', ['active', 'warning', 'error']);

// ---------------------------------------------------------------
// Auth lokal (pengganti Supabase auth.users)
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

// Sesi server-side opsional (di samping JWT cookie) untuk dukung revoke.
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
// RSS feeds (kolom mengikuti Supabase asli)
// ---------------------------------------------------------------
export const rssFeeds = pgTable('rss_feeds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  category: text('category'),
  status: feedStatusEnum('status').notNull().default('active'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  healthScore: integer('health_score').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------
// News articles
// ---------------------------------------------------------------
export const newsArticles = pgTable(
  'news_articles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    feedId: uuid('feed_id').references(() => rssFeeds.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    url: text('url').notNull().unique(),
    source: text('source').notNull(),
    category: text('category'),
    content: text('content'),
    excerpt: text('excerpt'),
    author: text('author'),
    imageUrl: text('image_url'),
    language: text('language').default('id'),
    region: text('region'),
    // text[] in Postgres
    keywords: text('keywords').array().default(sql`'{}'::text[]`),
    sentiment: sentimentTypeEnum('sentiment'),
    sentimentScore: numeric('sentiment_score', { precision: 4, scale: 3 }),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    publishedIdx: index('idx_news_published_at').on(t.publishedAt),
    categoryIdx: index('idx_news_category').on(t.category),
    sourceIdx: index('idx_news_source').on(t.source),
    sentimentIdx: index('idx_news_sentiment').on(t.sentiment),
  }),
);

// ---------------------------------------------------------------
// Tracked keywords (sesuai Supabase)
// ---------------------------------------------------------------
export const trackedKeywords = pgTable('tracked_keywords', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyword: text('keyword').notNull().unique(),
  alertEnabled: boolean('alert_enabled').notNull().default(false),
  mentionCount: integer('mention_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------
// Keyword queries (boolean expression yang disimpan)
// ---------------------------------------------------------------
export const keywordQueries = pgTable('keyword_queries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  expression: text('expression').notNull(),
  terms: text('terms').array().notNull().default(sql`'{}'::text[]`),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type TrackedKeyword = typeof trackedKeywords.$inferSelect;
export type KeywordQuery = typeof keywordQueries.$inferSelect;
export type AppRole = (typeof appRoleEnum.enumValues)[number];
