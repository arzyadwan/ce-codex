import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createArticleSchema, listArticlesQuerySchema, requestChangesSchema, scheduleArticleSchema, updateArticleSchema, updateCategorySchema } from "@crypto-exist/contracts";
import { and, count, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import { articleApprovals, articleRevisions, articles, articleTags, auditLogs, categories, notifications, profiles, tags } from "../database/schema.js";
import { assertCanApprove, EditorialPolicyError } from "./approval-policy.js";

@Injectable()
export class EditorialService {
  constructor(private readonly database: DatabaseService) {}

  async listPublished(query: Record<string, unknown> = {}) {
    await this.publishDueArticles();
    const parsed = listArticlesQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const filters = parsed.data;
    const conditions = [eq(articles.status, "published")];
    if (filters.category) conditions.push(eq(categories.slug, filters.category));
    if (filters.q) conditions.push(or(ilike(articles.title, `%${filters.q}%`), ilike(articles.excerpt, `%${filters.q}%`))!);
    if (filters.tag) conditions.push(sql`exists (select 1 from ${articleTags} at join ${tags} t on t.id = at.tag_id where at.article_id = ${articles.id} and t.slug = ${filters.tag})`);
    if (filters.author) conditions.push(eq(profiles.username, filters.author));
    const where = and(...conditions);
    const [totalRow] = await this.database.db.select({ total: count() }).from(articles).leftJoin(categories, eq(articles.categoryId, categories.id)).innerJoin(profiles, eq(articles.authorId, profiles.id)).where(where);
    const rows = await this.database.db.select({ article: articles, category: categories, author: { displayName: profiles.displayName, username: profiles.username } }).from(articles).leftJoin(categories, eq(articles.categoryId, categories.id)).innerJoin(profiles, eq(articles.authorId, profiles.id)).where(where).orderBy(desc(articles.isFeatured), desc(articles.publishedAt)).limit(filters.limit).offset((filters.page - 1) * filters.limit);
    const items = await Promise.all(rows.map(async ({ article, category, author }) => ({ ...article, category, author, tags: await this.getArticleTags(article.id) })));
    const total = totalRow?.total ?? 0;
    return { items, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.max(1, Math.ceil(total / filters.limit)) } };
  }

  async listPublicFacets() {
    const published = eq(articles.status, "published");
    const categoryRows = await this.database.db.select({ name: categories.name, slug: categories.slug, description: categories.description, count: count(articles.id) }).from(categories).leftJoin(articles, and(eq(articles.categoryId, categories.id), published)).groupBy(categories.id).orderBy(categories.name);
    const tagRows = await this.database.db.select({ name: tags.name, slug: tags.slug, count: count(articleTags.articleId) }).from(tags).leftJoin(articleTags, eq(tags.id, articleTags.tagId)).leftJoin(articles, and(eq(articleTags.articleId, articles.id), published)).groupBy(tags.id).orderBy(desc(count(articleTags.articleId)), tags.name);
    const authorRows = await this.database.db.select({ displayName: profiles.displayName, username: profiles.username, count: count(articles.id) }).from(profiles).leftJoin(articles, and(eq(articles.authorId, profiles.id), published)).groupBy(profiles.id).orderBy(profiles.displayName);
    return { categories: categoryRows, tags: tagRows.filter((tag) => tag.count > 0), authors: authorRows.filter((author) => author.count > 0) };
  }

  async listMine(userId: string) {
    await this.requireProfile(userId);
    const rows = await this.database.db.select().from(articles).where(eq(articles.authorId, userId)).orderBy(desc(articles.updatedAt));
    return Promise.all(rows.map(async (article) => ({ ...article, latestRevision: await this.getLatestRevision(article.id) })));
  }

  async listReviewQueue(userId: string) {
    const profile = await this.requireProfile(userId);
    if (profile.role !== "editor" && profile.role !== "admin") throw new ForbiddenException("Antrean review hanya tersedia untuk editor atau admin.");
    return this.database.db.select().from(articles).where(eq(articles.status, "in_review")).orderBy(desc(articles.submittedAt));
  }

  async listTaxonomy(actorId: string) {
    await this.requireAdmin(actorId);
    const categoryRows = await this.database.db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, usageCount: count(articles.id) }).from(categories).leftJoin(articles, eq(categories.id, articles.categoryId)).groupBy(categories.id).orderBy(categories.name);
    const tagRows = await this.database.db.select({ id: tags.id, name: tags.name, slug: tags.slug, usageCount: count(articleTags.articleId) }).from(tags).leftJoin(articleTags, eq(tags.id, articleTags.tagId)).groupBy(tags.id).orderBy(desc(count(articleTags.articleId)), tags.name);
    return { categories: categoryRows, tags: tagRows };
  }

  async updateCategory(categoryId: string, actorId: string, body: unknown) {
    await this.requireAdmin(actorId);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const [updated] = await this.database.db.update(categories).set(parsed.data).where(eq(categories.id, categoryId)).returning();
    if (!updated) throw new NotFoundException("Kategori tidak ditemukan.");
    await this.database.db.insert(auditLogs).values({ actorId, action: "taxonomy.category_updated", targetType: "category", targetId: categoryId, metadata: { name: updated.name } });
    return updated;
  }

  async deleteUnusedTag(tagId: string, actorId: string) {
    await this.requireAdmin(actorId);
    const [usage] = await this.database.db.select({ total: count() }).from(articleTags).where(eq(articleTags.tagId, tagId));
    if ((usage?.total ?? 0) > 0) throw new BadRequestException("Tag masih digunakan artikel dan tidak dapat dihapus.");
    const [deleted] = await this.database.db.delete(tags).where(eq(tags.id, tagId)).returning();
    if (!deleted) throw new NotFoundException("Tag tidak ditemukan.");
    await this.database.db.insert(auditLogs).values({ actorId, action: "taxonomy.tag_deleted", targetType: "tag", targetId: tagId, metadata: { name: deleted.name } });
    return { deleted: true, tag: deleted };
  }

  async getPublishedBySlug(slug: string) {
    await this.publishDueArticles();
    const [article] = await this.database.db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).limit(1);
    if (!article) throw new NotFoundException("Artikel tidak ditemukan.");
    return this.enrichArticle(article);
  }

  async getEditorial(articleId: string, actorId: string) {
    const article = await this.requireArticle(articleId);
    const actor = await this.requireProfile(actorId);
    const canRead = article.authorId === actorId || actor.role === "editor" || actor.role === "admin";
    if (!canRead) throw new ForbiddenException("Anda tidak memiliki akses ke artikel ini.");
    const enriched = await this.enrichArticle(article);
    const revisionNotes = await this.getRevisionHistory(articleId);
    const canEdit = (article.authorId === actorId || actor.role === "admin") && (article.status === "draft" || article.status === "changes_requested");
    return { ...enriched, revisionNotes, canEdit };
  }

  async create(authorId: string, body: unknown) {
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    await this.requireProfile(authorId);
    const { categorySlug, tags: tagNames, ...articleInput } = parsed.data;
    const categoryId = categorySlug ? await this.resolveCategoryId(categorySlug) : undefined;
    const [article] = await this.database.db.insert(articles).values({ ...articleInput, categoryId, authorId }).returning();
    await this.syncTags(article.id, tagNames);
    await this.log(authorId, "article.created", article.id);
    return this.enrichArticle(article);
  }

  async update(articleId: string, actorId: string, body: unknown) {
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const article = await this.requireArticle(articleId);
    const actor = await this.requireProfile(actorId);
    if (article.authorId !== actorId && actor.role !== "admin") throw new ForbiddenException("Hanya penulis atau admin yang dapat mengubah draft.");
    if (article.status !== "draft" && article.status !== "changes_requested") throw new BadRequestException("Artikel hanya dapat diubah saat draft atau sedang direvisi.");
    const { categorySlug, tags: tagNames, ...articleInput } = parsed.data;
    const categoryId = categorySlug ? await this.resolveCategoryId(categorySlug) : categorySlug === undefined ? undefined : null;
    const values = { ...articleInput, ...(categorySlug !== undefined ? { categoryId } : {}), updatedAt: new Date() };
    const [updated] = await this.database.db.update(articles).set(values).where(and(eq(articles.id, articleId), or(eq(articles.status, "draft"), eq(articles.status, "changes_requested")))).returning();
    if (!updated) throw new BadRequestException("Status artikel berubah; muat ulang lalu coba kembali.");
    if (tagNames !== undefined) await this.syncTags(articleId, tagNames);
    await this.log(actorId, "article.updated", articleId);
    return this.enrichArticle(updated);
  }

  async submit(articleId: string, actorId: string) {
    const article = await this.requireArticle(articleId);
    const actor = await this.requireProfile(actorId);
    if (article.authorId !== actorId && actor.role !== "admin") throw new ForbiddenException("Hanya penulis atau admin yang dapat mengirim artikel untuk ditinjau.");
    if (article.status !== "draft" && article.status !== "changes_requested") throw new BadRequestException("Hanya draft atau artikel yang sudah direvisi yang dapat dikirim untuk ditinjau.");
    return this.database.db.transaction(async (tx) => {
      const [updated] = await tx.update(articles).set({ status: "in_review", submittedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(articles.id, articleId), or(eq(articles.status, "draft"), eq(articles.status, "changes_requested")))).returning();
      if (!updated) throw new BadRequestException("Status artikel berubah; muat ulang lalu coba kembali.");
      await tx.update(articleRevisions).set({ resolvedAt: new Date() }).where(and(eq(articleRevisions.articleId, articleId), sql`${articleRevisions.resolvedAt} is null`));
      const reviewers = await tx.select({ id: profiles.id, role: profiles.role }).from(profiles);
      const recipients = reviewers.filter((item) => item.id !== actorId && (item.role === "editor" || item.role === "admin"));
      if (recipients.length > 0) await tx.insert(notifications).values(recipients.map((recipient) => ({
        recipientId: recipient.id, actorId, articleId, type: "review_requested",
        title: "Artikel menunggu review", message: `“${article.title}” telah dikirim ke antrean review.`,
        dedupeKey: `article:${articleId}:submitted:${updated.submittedAt?.toISOString() ?? updated.updatedAt.toISOString()}`,
      }))).onConflictDoNothing();
      await tx.insert(auditLogs).values({ actorId, action: "article.submitted", targetType: "article", targetId: articleId });
      return updated;
    });
  }

  async approveAndPublish(articleId: string, approverId: string) {
    const article = await this.requireArticle(articleId);
    const approver = await this.requireProfile(approverId);
    try {
      assertCanApprove({ approverId, approverRole: approver.role, articleAuthorId: article.authorId, status: article.status });
    } catch (error) {
      if (error instanceof EditorialPolicyError) throw new ForbiddenException(error.message);
      throw error;
    }

    return this.database.db.transaction(async (tx) => {
      const [approval] = await tx.insert(articleApprovals).values({ articleId, approvedBy: approverId }).onConflictDoNothing().returning();
      if (!approval) throw new BadRequestException("Artikel ini sudah memperoleh persetujuan.");
      const [published] = await tx.update(articles).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(and(eq(articles.id, articleId), eq(articles.status, "in_review"))).returning();
      if (!published) throw new BadRequestException("Status artikel berubah; muat ulang lalu coba kembali.");
      await tx.insert(notifications).values({
        recipientId: article.authorId, actorId: approverId, articleId, type: "article_published",
        title: "Artikel disetujui dan terbit", message: `“${article.title}” telah disetujui dan dipublikasikan.`,
        dedupeKey: `article:${articleId}:approved-published`,
      }).onConflictDoNothing();
      await tx.insert(auditLogs).values({ actorId: approverId, action: "article.approved_and_published", targetType: "article", targetId: articleId });
      return { article: published, approval };
    });
  }

  async requestChanges(articleId: string, reviewerId: string, body: unknown) {
    const parsed = requestChangesSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const article = await this.requireArticle(articleId);
    const reviewer = await this.requireProfile(reviewerId);
    if (reviewer.role !== "editor" && reviewer.role !== "admin") throw new ForbiddenException("Hanya editor atau admin yang dapat meminta revisi.");
    if (article.authorId === reviewerId) throw new ForbiddenException("Penulis tidak dapat meminta revisi untuk artikelnya sendiri.");
    if (article.status !== "in_review") throw new BadRequestException("Revisi hanya dapat diminta ketika artikel sedang ditinjau.");
    return this.database.db.transaction(async (tx) => {
      const [revision] = await tx.insert(articleRevisions).values({ articleId, requestedBy: reviewerId, note: parsed.data.note }).returning();
      const [updated] = await tx.update(articles).set({ status: "changes_requested", updatedAt: new Date() }).where(and(eq(articles.id, articleId), eq(articles.status, "in_review"))).returning();
      if (!updated) throw new BadRequestException("Status artikel berubah; muat ulang lalu coba kembali.");
      await tx.insert(notifications).values({
        recipientId: article.authorId, actorId: reviewerId, articleId, type: "changes_requested",
        title: "Revisi diperlukan", message: `Editor meminta perbaikan pada “${article.title}”.`,
        dedupeKey: `article:${articleId}:revision:${revision.id}`,
      }).onConflictDoNothing();
      await tx.insert(auditLogs).values({ actorId: reviewerId, action: "article.changes_requested", targetType: "article", targetId: articleId, metadata: { revisionId: revision.id } });
      return { article: updated, revision };
    });
  }

  async schedule(articleId: string, approverId: string, body: unknown) {
    const parsed = scheduleArticleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const article = await this.requireArticle(articleId);
    const approver = await this.requireProfile(approverId);
    try {
      assertCanApprove({ approverId, approverRole: approver.role, articleAuthorId: article.authorId, status: article.status });
    } catch (error) {
      if (error instanceof EditorialPolicyError) throw new ForbiddenException(error.message);
      throw error;
    }
    const publishAt = new Date(parsed.data.publishAt);
    return this.database.db.transaction(async (tx) => {
      const [approval] = await tx.insert(articleApprovals).values({ articleId, approvedBy: approverId }).onConflictDoNothing().returning();
      if (!approval) throw new BadRequestException("Artikel ini sudah memperoleh persetujuan.");
      const [scheduled] = await tx.update(articles).set({ status: "scheduled", publishedAt: publishAt, updatedAt: new Date() }).where(and(eq(articles.id, articleId), eq(articles.status, "in_review"))).returning();
      if (!scheduled) throw new BadRequestException("Status artikel berubah; muat ulang lalu coba kembali.");
      await tx.insert(notifications).values({
        recipientId: article.authorId, actorId: approverId, articleId, type: "article_scheduled",
        title: "Artikel dijadwalkan", message: `“${article.title}” telah disetujui dan dijadwalkan untuk terbit.`,
        dedupeKey: `article:${articleId}:approved-scheduled`,
      }).onConflictDoNothing();
      await tx.insert(auditLogs).values({ actorId: approverId, action: "article.approved_and_scheduled", targetType: "article", targetId: articleId, metadata: { publishAt: publishAt.toISOString() } });
      return { article: scheduled, approval };
    });
  }

  private async requireArticle(id: string) {
    const [article] = await this.database.db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!article) throw new NotFoundException("Artikel tidak ditemukan.");
    return article;
  }

  private async requireProfile(id: string) {
    const [profile] = await this.database.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    if (!profile) throw new ForbiddenException("Profil editorial belum tersedia.");
    return profile;
  }

  private async requireAdmin(id: string) {
    const profile = await this.requireProfile(id);
    if (profile.role !== "admin") throw new ForbiddenException("Pengelolaan kategori dan tag hanya tersedia untuk admin.");
    return profile;
  }

  private async resolveCategoryId(slug: string) {
    const [category] = await this.database.db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (!category) throw new BadRequestException("Kategori artikel tidak tersedia.");
    return category.id;
  }

  private async syncTags(articleId: string, names: string[]) {
    await this.database.db.delete(articleTags).where(eq(articleTags.articleId, articleId));
    for (const name of [...new Set(names.map((item) => item.trim()).filter(Boolean))]) {
      const slug = name.toLocaleLowerCase("id-ID").normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const [tag] = await this.database.db.insert(tags).values({ name, slug }).onConflictDoUpdate({ target: tags.slug, set: { name } }).returning({ id: tags.id });
      await this.database.db.insert(articleTags).values({ articleId, tagId: tag.id }).onConflictDoNothing();
    }
  }

  private async getArticleTags(articleId: string) {
    return this.database.db.select({ id: tags.id, name: tags.name, slug: tags.slug }).from(articleTags).innerJoin(tags, eq(articleTags.tagId, tags.id)).where(eq(articleTags.articleId, articleId));
  }

  private async getLatestRevision(articleId: string) {
    const [revision] = await this.database.db.select({ id: articleRevisions.id, note: articleRevisions.note, createdAt: articleRevisions.createdAt, resolvedAt: articleRevisions.resolvedAt }).from(articleRevisions).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt)).limit(1);
    return revision ?? null;
  }

  private async getRevisionHistory(articleId: string) {
    return this.database.db.select({ id: articleRevisions.id, note: articleRevisions.note, createdAt: articleRevisions.createdAt, resolvedAt: articleRevisions.resolvedAt, requestedBy: profiles.displayName }).from(articleRevisions).innerJoin(profiles, eq(articleRevisions.requestedBy, profiles.id)).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt));
  }

  private async publishDueArticles() {
    const due = await this.database.db.update(articles).set({ status: "published", updatedAt: new Date() }).where(and(eq(articles.status, "scheduled"), lte(articles.publishedAt, new Date()))).returning({ id: articles.id, authorId: articles.authorId, title: articles.title });
    if (due.length > 0) {
      await this.database.db.insert(notifications).values(due.map((article) => ({
        recipientId: article.authorId, articleId: article.id, type: "article_published",
        title: "Artikel telah terbit", message: `“${article.title}” telah dipublikasikan sesuai jadwal.`,
        dedupeKey: `article:${article.id}:scheduled-published`,
      }))).onConflictDoNothing();
      await this.database.db.insert(auditLogs).values(due.map((article) => ({ action: "article.scheduled_published", targetType: "article", targetId: article.id, metadata: {} })));
    }
  }

  private async enrichArticle<T extends { id: string; categoryId: string | null }>(article: T) {
    const [category] = article.categoryId ? await this.database.db.select().from(categories).where(eq(categories.id, article.categoryId)).limit(1) : [];
    const [author] = await this.database.db.select({ displayName: profiles.displayName, username: profiles.username }).from(profiles).where(eq(profiles.id, (article as T & { authorId: string }).authorId)).limit(1);
    return { ...article, category: category ?? null, author: author ?? null, tags: await this.getArticleTags(article.id) };
  }

  private async log(actorId: string, action: string, targetId: string) {
    await this.database.db.insert(auditLogs).values({ actorId, action, targetType: "article", targetId });
  }
}
