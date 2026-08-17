# ADR 0001: Arsitektur Three-Tier Crypto Exist

- Status: Accepted
- Tanggal: 2026-08-17

## Keputusan

1. Presentation Tier: Next.js App Router pada `apps/web`.
2. Application Tier: NestJS REST API pada `apps/api`, dengan prefix `/v1` dan OpenAPI.
3. Data Tier: Supabase PostgreSQL melalui Drizzle ORM. Media disimpan pada Cloudflare R2.
4. Semua mutasi data dan signed upload URL melewati Application Tier.
5. Supabase Auth menyediakan identitas; API menerapkan role `author`, `editor`, atau `admin`.
6. Artikel membutuhkan satu persetujuan dari editor atau admin sebelum dijadwalkan atau diterbitkan.

## Konsekuensi

- Frontend dan API dideploy terpisah.
- Kontrak API berada pada `packages/contracts` dan tidak mengekspos model database mentah.
- Browser tidak memperoleh database password, Supabase service-role key, atau R2 secret.
- Audit log merekam approval, publish, archive, role change, dan operasi sensitif.
