import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createAdCampaignSchema, trackAdEventSchema, updateAdCampaignSchema } from "@crypto-exist/contracts";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";
import { adCampaigns, adEvents, auditLogs, profiles } from "../database/schema.js";

@Injectable()
export class MonetizationService {
  constructor(private readonly database: DatabaseService) {}

  async list(actorId: string) {
    await this.requireAdmin(actorId);
    return this.database.db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
  }

  async create(actorId: string, body: unknown) {
    await this.requireAdmin(actorId);
    const parsed = createAdCampaignSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const [campaign] = await this.database.db.insert(adCampaigns).values({ ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), createdBy: actorId }).returning();
    await this.log(actorId, "ad_campaign.created", campaign.id);
    return campaign;
  }

  async update(id: string, actorId: string, body: unknown) {
    await this.requireAdmin(actorId);
    const parsed = updateAdCampaignSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const [current] = await this.database.db.select().from(adCampaigns).where(eq(adCampaigns.id, id)).limit(1);
    if (!current) throw new NotFoundException("Campaign tidak ditemukan.");
    const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : current.startsAt;
    const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : current.endsAt;
    if (endsAt <= startsAt) throw new BadRequestException("Waktu selesai harus setelah waktu mulai.");
    const [updated] = await this.database.db.update(adCampaigns).set({ ...parsed.data, startsAt, endsAt, updatedAt: new Date() }).where(eq(adCampaigns.id, id)).returning();
    await this.log(actorId, "ad_campaign.updated", id);
    return updated;
  }

  async active(placement: string) {
    const now = new Date();
    const [campaign] = await this.database.db.select({ id: adCampaigns.id, advertiser: adCampaigns.advertiser, placement: adCampaigns.placement, creativeUrl: adCampaigns.creativeUrl, creativeAlt: adCampaigns.creativeAlt, destinationUrl: adCampaigns.destinationUrl }).from(adCampaigns).where(and(eq(adCampaigns.status, "active"), eq(adCampaigns.placement, placement), lte(adCampaigns.startsAt, now), gte(adCampaigns.endsAt, now))).orderBy(adCampaigns.updatedAt).limit(1);
    return campaign ?? null;
  }

  async track(body: unknown) {
    const parsed = trackAdEventSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const now = new Date();
    const [campaign] = await this.database.db.select({ id: adCampaigns.id }).from(adCampaigns).where(and(eq(adCampaigns.id, parsed.data.campaignId), eq(adCampaigns.status, "active"), lte(adCampaigns.startsAt, now), gte(adCampaigns.endsAt, now))).limit(1);
    if (!campaign) throw new NotFoundException("Campaign aktif tidak ditemukan.");
    const sessionHash = parsed.data.sessionId ? createHash("sha256").update(`${campaign.id}:${parsed.data.sessionId}:${process.env.AD_TRACKING_SALT ?? "crypto-exist"}`).digest("hex") : null;
    await this.database.db.transaction(async (tx) => {
      await tx.insert(adEvents).values({ campaignId: campaign.id, type: parsed.data.type, sessionHash });
      await tx.update(adCampaigns).set(parsed.data.type === "impression" ? { impressionCount: sql`${adCampaigns.impressionCount} + 1` } : { clickCount: sql`${adCampaigns.clickCount} + 1` }).where(eq(adCampaigns.id, campaign.id));
    });
    return { accepted: true };
  }

  private async requireAdmin(id: string) {
    const [profile] = await this.database.db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, id)).limit(1);
    if (profile?.role !== "admin") throw new ForbiddenException("Monetisasi hanya dapat dikelola admin.");
  }
  private async log(actorId: string, action: string, targetId: string) { await this.database.db.insert(auditLogs).values({ actorId, action, targetType: "ad_campaign", targetId }); }
}
