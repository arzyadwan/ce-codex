import { Injectable, NotFoundException } from "@nestjs/common";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import { articles, notifications } from "../database/schema.js";

@Injectable()
export class NotificationsService {
  constructor(private readonly database: DatabaseService) {}

  async list(recipientId: string) {
    const [unread] = await this.database.db.select({ total: count() }).from(notifications)
      .where(and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt)));
    const items = await this.database.db.select({
      id: notifications.id, type: notifications.type, title: notifications.title,
      message: notifications.message, articleId: notifications.articleId,
      articleSlug: articles.slug, readAt: notifications.readAt, createdAt: notifications.createdAt,
    }).from(notifications).leftJoin(articles, eq(notifications.articleId, articles.id))
      .where(eq(notifications.recipientId, recipientId))
      .orderBy(desc(notifications.createdAt)).limit(20);
    return { items, unreadCount: unread?.total ?? 0 };
  }

  async markRead(notificationId: string, recipientId: string) {
    const [updated] = await this.database.db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)))
      .returning({ id: notifications.id, readAt: notifications.readAt });
    if (!updated) throw new NotFoundException("Notifikasi tidak ditemukan.");
    return updated;
  }

  async markAllRead(recipientId: string) {
    const updated = await this.database.db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return { updated: updated.length };
  }
}
