import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MonetizationService } from "./monetization.service.js";

@Controller("monetization")
export class MonetizationController {
  constructor(private readonly service: MonetizationService) {}
  @Get("banner/:placement") getBanner(@Param("placement") placement: string) { return this.service.active(placement); }
  @Post("events") @Throttle({ burst: { limit: 10, ttl: 1000 }, sustained: { limit: 120, ttl: 60000 } }) track(@Body() body: unknown) { return this.service.track(body); }
  @Get("campaigns") @UseGuards(SupabaseAuthGuard) list(@CurrentUser() user: AuthenticatedUser) { return this.service.list(user.id); }
  @Post("campaigns") @UseGuards(SupabaseAuthGuard) create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.service.create(user.id, body); }
  @Patch("campaigns/:id") @UseGuards(SupabaseAuthGuard) update(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.service.update(id, user.id, body); }
}
