import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { EditorialService } from "./editorial.service.js";

@ApiTags("articles")
@Controller("articles")
export class EditorialController {
  constructor(private readonly editorial: EditorialService) {}

  @Get()
  listPublished(@Query() query: Record<string, unknown>) { return this.editorial.listPublished(query); }

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  listMine(@CurrentUser() user: AuthenticatedUser) { return this.editorial.listMine(user.id); }

  @Get("review-queue")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  listReviewQueue(@CurrentUser() user: AuthenticatedUser) { return this.editorial.listReviewQueue(user.id); }

  @Get("facets")
  listPublicFacets() { return this.editorial.listPublicFacets(); }

  @Get("editorial/:id")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  getEditorial(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.editorial.getEditorial(id, user.id); }

  @Get(":slug")
  getPublished(@Param("slug") slug: string) { return this.editorial.getPublishedBySlug(slug); }

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.editorial.create(user.id, body); }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  update(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.editorial.update(id, user.id, body); }

  @Post(":id/submit")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  submit(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.editorial.submit(id, user.id); }

  @Post(":id/approve")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  approve(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.editorial.approveAndPublish(id, user.id); }

  @Post(":id/request-changes")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  requestChanges(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.editorial.requestChanges(id, user.id, body); }

  @Post(":id/schedule")
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  schedule(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.editorial.schedule(id, user.id, body); }
}
