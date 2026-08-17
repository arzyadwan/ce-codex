import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller.js";
import { EditorialModule } from "./editorial/editorial.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { MediaModule } from "./media/media.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { positiveInteger } from "./security/security-config.js";
import { NewsletterModule } from "./newsletter/newsletter.module.js";
import { MarketModule } from "./market/market.module.js";
import { MonetizationModule } from "./monetization/monetization.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    ThrottlerModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => [
      { name: "burst", ttl: 1_000, limit: positiveInteger(config.get("RATE_LIMIT_BURST"), 10, "RATE_LIMIT_BURST", 1_000), blockDuration: 2_000 },
      { name: "sustained", ttl: 60_000, limit: positiveInteger(config.get("RATE_LIMIT_PER_MINUTE"), 120, "RATE_LIMIT_PER_MINUTE", 10_000), blockDuration: 60_000 },
    ] }),
    DatabaseModule, AuthModule, EditorialModule, MediaModule, NotificationsModule, NewsletterModule, MarketModule, MonetizationModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
