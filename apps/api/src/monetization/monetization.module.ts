import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MonetizationController } from "./monetization.controller.js";
import { MonetizationService } from "./monetization.service.js";
@Module({ imports: [AuthModule], controllers: [MonetizationController], providers: [MonetizationService] })
export class MonetizationModule {}
