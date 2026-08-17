import { Body, Controller, Delete, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NewsletterService } from "./newsletter.service.js";

@ApiTags("newsletter")
@Controller("newsletter")
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post("subscribe")
  subscribe(@Body() body: unknown) { return this.newsletter.subscribe(body); }

  @Delete("unsubscribe")
  unsubscribe(@Query("email") email: string) { return this.newsletter.unsubscribe(email); }
}
