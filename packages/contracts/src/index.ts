import { z } from "zod";

export const articleStatusSchema = z.enum(["draft", "changes_requested", "in_review", "scheduled", "published", "archived"]);
export const editorialRoleSchema = z.enum(["author", "editor", "admin"]);
export const articleContentTypeSchema = z.enum(["news", "analysis", "opinion", "education", "press_release", "sponsored"]);
export const articleSourceSchema = z.object({
  title: z.string().trim().min(3).max(180),
  url: z.string().url().max(2048),
  publisher: z.string().trim().min(2).max(100).optional(),
});
export const richTextDocumentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.record(z.string(), z.unknown())),
});
export const categorySlugSchema = z.enum(["berita-pasar", "analisis", "edukasi", "web3-defi"]);
export const tagNameSchema = z.string().trim().min(2).max(40).regex(/^[\p{L}\p{N}][\p{L}\p{N} .+#-]*$/u);
export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(9),
  category: categorySlugSchema.optional(),
  tag: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  q: z.string().trim().max(100).optional(),
  author: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
});
export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
});
export const adPlacementSchema = z.enum(["homepage_leaderboard", "homepage_inline", "article_inline", "article_sidebar"]);
export const adCampaignStatusSchema = z.enum(["draft", "active", "paused", "ended"]);
export const createAdCampaignSchema = z.object({
  name: z.string().trim().min(3).max(120), advertiser: z.string().trim().min(2).max(120),
  placement: adPlacementSchema, creativeUrl: z.string().url().max(2048),
  creativeAlt: z.string().trim().min(5).max(180), destinationUrl: z.string().url().max(2048),
  startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }),
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { path: ["endsAt"], message: "Waktu selesai harus setelah waktu mulai." });
export const updateAdCampaignSchema = z.object({
  status: adCampaignStatusSchema.optional(), name: z.string().trim().min(3).max(120).optional(),
  advertiser: z.string().trim().min(2).max(120).optional(), placement: adPlacementSchema.optional(),
  creativeUrl: z.string().url().max(2048).optional(), creativeAlt: z.string().trim().min(5).max(180).optional(),
  destinationUrl: z.string().url().max(2048).optional(), startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).optional(),
}).refine((value) => Object.keys(value).length > 0, "Minimal satu bidang harus diubah.");
export const trackAdEventSchema = z.object({ campaignId: z.string().uuid(), type: z.enum(["impression", "click"]), sessionId: z.string().trim().min(8).max(128).optional() });
export const updateCategorySchema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().max(240).optional(),
});
export const requestChangesSchema = z.object({ note: z.string().trim().min(10).max(1000) });
export const scheduleArticleSchema = z.object({ publishAt: z.string().datetime({ offset: true }) }).superRefine((value, context) => {
  const timestamp = new Date(value.publishAt).getTime();
  if (timestamp < Date.now() + 60_000) context.addIssue({ code: "custom", path: ["publishAt"], message: "Waktu terbit minimal satu menit dari sekarang." });
  if (timestamp > Date.now() + 366 * 24 * 60 * 60 * 1000) context.addIssue({ code: "custom", path: ["publishAt"], message: "Waktu terbit maksimal satu tahun dari sekarang." });
});
const articleInputSchema = z.object({
  title: z.string().trim().min(10).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  excerpt: z.string().trim().min(20).max(320),
  featuredImageUrl: z.string().url().max(2048).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  categorySlug: categorySlugSchema.optional(),
  tags: z.array(tagNameSchema).max(8).default([]),
  contentType: articleContentTypeSchema.default("news"),
  sources: z.array(articleSourceSchema).max(20).default([]),
  sponsorName: z.string().trim().min(2).max(120).optional(),
  sponsorUrl: z.string().url().max(2048).optional(),
  sponsorDisclosure: z.string().trim().min(20).max(1000).optional(),
  affiliateDisclosure: z.string().trim().min(20).max(1000).optional(),
  content: richTextDocumentSchema,
});
const validateCommercialDisclosure = (value: z.infer<typeof articleInputSchema>, context: z.RefinementCtx) => {
  if (value.contentType === "sponsored" && !value.sponsorName) context.addIssue({ code: "custom", path: ["sponsorName"], message: "Nama sponsor wajib untuk konten sponsor." });
  if (value.contentType === "sponsored" && !value.sponsorDisclosure) context.addIssue({ code: "custom", path: ["sponsorDisclosure"], message: "Disclosure sponsor wajib dan minimal 20 karakter." });
};
export const createArticleSchema = articleInputSchema.superRefine(validateCommercialDisclosure);
export const updateArticleSchema = articleInputSchema.partial().superRefine((value, context) => {
  if (Object.keys(value).length === 0) context.addIssue({ code: "custom", message: "Minimal satu bidang harus diubah." });
  if (value.contentType === "sponsored" && !value.sponsorName) context.addIssue({ code: "custom", path: ["sponsorName"], message: "Nama sponsor wajib untuk konten sponsor." });
  if (value.contentType === "sponsored" && !value.sponsorDisclosure) context.addIssue({ code: "custom", path: ["sponsorDisclosure"], message: "Disclosure sponsor wajib dan minimal 20 karakter." });
});
export const approveArticleSchema = z.object({
  articleId: z.string().uuid(),
  approverId: z.string().uuid(),
  approverRole: z.enum(["editor", "admin"]),
});
export const requestMediaUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  purpose: z.enum(["article", "advertisement"]).default("article"),
});
export const articleSummarySchema = z.object({
  id: z.string().uuid(), slug: z.string().min(1), title: z.string().min(1),
  excerpt: z.string(), status: articleStatusSchema,
  publishedAt: z.string().datetime().nullable(),
});
export type ArticleSummary = z.infer<typeof articleSummarySchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ApproveArticleInput = z.infer<typeof approveArticleSchema>;
export type RequestMediaUploadInput = z.infer<typeof requestMediaUploadSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type ScheduleArticleInput = z.infer<typeof scheduleArticleSchema>;
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
export type UpdateAdCampaignInput = z.infer<typeof updateAdCampaignSchema>;
