import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const editorialRole = pgEnum("editorial_role", ["author", "editor", "admin"]);
export const articleStatus = pgEnum("article_status", ["draft", "changes_requested", "in_review", "scheduled", "published", "archived"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), displayName: text("display_name").notNull(),
  username: text("username").notNull(), role: editorialRole("role").notNull().default("author"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("profiles_username_key").on(table.username)]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), slug: text("slug").notNull(),
  description: text("description"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("categories_slug_key").on(table.slug)]);

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(), authorId: uuid("author_id").notNull().references(() => profiles.id),
  title: text("title").notNull(), slug: text("slug").notNull(), excerpt: text("excerpt").notNull(),
  featuredImageUrl: text("featured_image_url"),
  seoTitle: text("seo_title"), seoDescription: text("seo_description"),
  categoryId: uuid("category_id").references(() => categories.id),
  content: jsonb("content").notNull(), status: articleStatus("status").notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBreaking: boolean("is_breaking").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }), publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("articles_slug_key").on(table.slug), index("articles_status_published_at_idx").on(table.status, table.publishedAt), index("articles_author_id_idx").on(table.authorId)]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), slug: text("slug").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("tags_slug_key").on(table.slug)]);

export const articleTags = pgTable("article_tags", {
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("article_tags_article_tag_key").on(table.articleId, table.tagId), index("article_tags_tag_id_idx").on(table.tagId)]);

export const articleApprovals = pgTable("article_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  approvedBy: uuid("approved_by").notNull().references(() => profiles.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("article_approvals_article_id_key").on(table.articleId)]);

export const articleRevisions = pgTable("article_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by").notNull().references(() => profiles.id), note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [index("article_revisions_article_id_idx").on(table.articleId, table.createdAt)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(), actorId: uuid("actor_id").references(() => profiles.id),
  action: text("action").notNull(), targetType: text("target_type").notNull(), targetId: uuid("target_id"),
  metadata: jsonb("metadata").notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_logs_target_idx").on(table.targetType, table.targetId)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }),
  type: text("type").notNull(), title: text("title").notNull(), message: text("message").notNull(),
  dedupeKey: text("dedupe_key").notNull(), readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notifications_recipient_dedupe_key").on(table.recipientId, table.dedupeKey),
  index("notifications_recipient_read_created_idx").on(table.recipientId, table.readAt, table.createdAt),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("newsletter_subscribers_email_key").on(table.email)]);
