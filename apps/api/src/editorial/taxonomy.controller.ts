import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import { EditorialService } from "./editorial.service.js";

@ApiTags("taxonomy")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("taxonomy")
export class TaxonomyController {
  constructor(private readonly editorial: EditorialService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) { return this.editorial.listTaxonomy(user.id); }

  @Patch("categories/:id")
  updateCategory(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.editorial.updateCategory(id, user.id, body); }

  @Delete("tags/:id")
  deleteTag(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.editorial.deleteUnusedTag(id, user.id); }
}
