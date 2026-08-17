import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MediaService } from "./media.service.js";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}
  @Post("upload-url")
  createUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.media.createUploadUrl(user.id, body); }
}
