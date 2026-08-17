import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthenticatedRequest } from "./auth.types.js";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabaseUrl: string;
  private readonly publishableKey: string;
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    if (!supabaseUrl) throw new Error("SUPABASE_URL wajib dikonfigurasi.");
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!publishableKey) throw new Error("Supabase publishable key wajib dikonfigurasi.");
    this.supabaseUrl = supabaseUrl;
    this.publishableKey = publishableKey;
    this.issuer = process.env.SUPABASE_JWT_ISSUER ?? `${supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Bearer token diperlukan.");
    const token = authorization.slice(7);
    try {
      const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer, audience: "authenticated" });
      if (!payload.sub) throw new Error("JWT tidak memiliki subject.");
      request.user = { id: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined };
      return true;
    } catch {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, { headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new UnauthorizedException("Access token tidak valid atau kedaluwarsa.");
      const user = await response.json() as { id?: string; email?: string };
      if (!user.id) throw new UnauthorizedException("Access token tidak memiliki identitas user.");
      request.user = { id: user.id, email: user.email };
      return true;
    }
  }
}
