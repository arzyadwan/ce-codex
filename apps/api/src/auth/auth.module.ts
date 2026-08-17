import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "./supabase-auth.guard.js";
import { ProfileController } from "./profile.controller.js";

@Module({ controllers: [ProfileController], providers: [SupabaseAuthGuard], exports: [SupabaseAuthGuard] })
export class AuthModule {}
