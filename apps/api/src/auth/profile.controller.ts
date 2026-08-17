import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import { profiles } from "../database/schema.js";
import { CurrentUser } from "./current-user.decorator.js";
import { SupabaseAuthGuard } from "./supabase-auth.guard.js";
import type { AuthenticatedUser } from "./auth.types.js";

@ApiTags("auth")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("me")
export class ProfileController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const [profile] = await this.database.db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    return { user: { id: user.id, email: user.email }, profile: profile ?? null };
  }
}
