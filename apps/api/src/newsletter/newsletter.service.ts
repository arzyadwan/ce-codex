import { BadRequestException, Injectable } from "@nestjs/common";
import { newsletterSubscribeSchema } from "@crypto-exist/contracts";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import { newsletterSubscribers } from "../database/schema.js";

@Injectable()
export class NewsletterService {
  constructor(private readonly database: DatabaseService) {}

  async subscribe(body: unknown) {
    const parsed = newsletterSubscribeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const [subscriber] = await this.database.db.insert(newsletterSubscribers)
      .values({ email: parsed.data.email })
      .onConflictDoUpdate({ target: newsletterSubscribers.email, set: { consentedAt: new Date(), unsubscribedAt: null } })
      .returning({ id: newsletterSubscribers.id });
    return { subscribed: true, id: subscriber.id };
  }

  async unsubscribe(email: string) {
    const parsed = newsletterSubscribeSchema.shape.email.safeParse(email);
    if (!parsed.success) throw new BadRequestException("Alamat email tidak valid.");
    await this.database.db.update(newsletterSubscribers).set({ unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.email, parsed.data));
    return { unsubscribed: true };
  }
}
