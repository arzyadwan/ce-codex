# Crypto Exist

Crypto Exist adalah platform media dan berita independen berbahasa Indonesia yang berfokus pada aset kripto, blockchain, Web3, dan DeFi. Aplikasi menyediakan pengalaman membaca publik serta ruang kerja redaksi untuk menulis, meninjau, menjadwalkan, dan menerbitkan artikel.

> Konten Crypto Exist bersifat informasional dan edukatif, bukan nasihat keuangan.

## Arsitektur

Proyek menggunakan arsitektur three-tier dalam monorepo Turborepo:

```text
Browser
  └─ Presentation tier: Next.js (`apps/web`)
       └─ Application tier: NestJS REST API `/v1` (`apps/api`)
            ├─ Supabase PostgreSQL + Auth
            └─ Cloudflare R2 object storage

Shared API contracts: `packages/contracts`
```

Teknologi utama:

- Next.js 16, React 19, dan TypeScript;
- NestJS 11 REST API;
- Supabase PostgreSQL dan Supabase Auth;
- Drizzle ORM;
- Cloudflare R2 melalui S3-compatible API;
- pnpm workspace dan Turborepo.

## Fitur yang tersedia

- halaman beranda dan detail artikel publik;
- login melalui Supabase Auth;
- role `author`, `editor`, dan `admin`;
- editor artikel rich text terstruktur;
- alur draft, review, revisi, persetujuan, penjadwalan, publikasi, dan arsip;
- satu persetujuan dari editor atau admin, dengan larangan self-approval;
- kategori, tag, revision history, audit log, dan notifikasi redaksi;
- upload media ke Cloudflare R2 menggunakan signed URL;
- scheduled publishing melalui Supabase Cron;
- rate limiting, CORS allowlist, Helmet, body limit, dan Swagger yang dapat dinonaktifkan.

## Struktur repository

```text
apps/
  api/                 NestJS application tier
  web/                 Next.js presentation tier
packages/
  contracts/           Kontrak dan validasi bersama
database/              Schema, RLS, trigger, dan scheduled publishing
design-system/         Token dan arahan visual Crypto Exist
docs/                  Security, runbook, brand, dan ADR
scripts/               Utility tingkat monorepo
```

Instruksi pengembangan dan keputusan produk lengkap tersedia di [AGENTS.md](./AGENTS.md).

## Prasyarat

- Node.js 22 atau lebih baru;
- pnpm 11.19.0 melalui Corepack;
- project Supabase untuk PostgreSQL dan Auth;
- bucket Cloudflare R2 beserta S3 access key.

Docker hanya dibutuhkan untuk membangun image API, bukan untuk development lokal.

## Instalasi lokal

1. Aktifkan pnpm dan instal dependency:

   ```bash
   corepack enable
   corepack prepare pnpm@11.19.0 --activate
   pnpm install --frozen-lockfile
   ```

2. Salin template environment:

   ```bash
   cp .env.example .env
   ```

   Pada Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Isi `.env` dengan URL/kredensial development milik Anda. Jangan memasukkan secret ke `.env.example` atau source code.

4. Sinkronkan environment publik untuk Next.js:

   ```bash
   pnpm env:sync
   ```

5. Terapkan schema database:

   ```bash
   pnpm --dir apps/api db:apply
   ```

6. Jalankan seluruh aplikasi:

   ```bash
   pnpm dev
   ```

Endpoint lokal:

- Web: <http://localhost:3000>
- API: <http://localhost:4000/v1>
- Health check: <http://localhost:4000/v1/health>
- Swagger development: <http://localhost:4000/docs>

## Environment variables

Gunakan [.env.example](./.env.example) sebagai daftar sumber kebenaran. Kelompok utamanya:

| Kelompok | Variabel |
| --- | --- |
| URL publik | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` |
| Supabase browser | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Database/API | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_ROLE_KEY` |
| Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` |
| API security | `CORS_ORIGIN`, `REQUEST_BODY_LIMIT`, `RATE_LIMIT_BURST`, `RATE_LIMIT_PER_MINUTE`, `SWAGGER_ENABLED`, `TRUST_PROXY` |

Variabel `SUPABASE_SERVICE_ROLE_KEY` dan seluruh kredensial R2 bersifat server-only. Jangan pernah memberi prefix `NEXT_PUBLIC_` pada secret.

## Perintah pengembangan

```bash
pnpm dev          # menjalankan web dan API dalam watch mode
pnpm build        # build production seluruh workspace
pnpm env:check    # memastikan template environment tidak berisi secret
pnpm typecheck    # pemeriksaan TypeScript
pnpm lint         # quality gate statis saat ini
pnpm test         # menjalankan test workspace
pnpm audit --prod # audit dependency production
```

## Continuous integration

Workflow GitHub Actions menjalankan pemeriksaan berikut pada setiap pull request dan push ke `main`:

- validasi `.env.example`;
- typecheck, lint, test, dan production build seluruh workspace;
- audit vulnerability dependency production tingkat tinggi/kritis;
- build image OCI untuk API dari `apps/api/Dockerfile`.

Dependabot memeriksa dependency npm setiap minggu dan GitHub Actions setiap bulan. Perubahan major tidak dikelompokkan otomatis agar migration guide dan dampaknya dapat ditinjau terpisah.

Utility API:

```bash
pnpm --dir apps/api db:apply
pnpm --dir apps/api db:audit-auth
pnpm --dir apps/api security:smoke
pnpm --dir apps/api user:bootstrap
```

## Alur editorial

```text
Draft → In Review → Revisi (opsional) → Disetujui → Dijadwalkan/Diterbitkan
```

- Author membuat artikel dan mengirimkannya untuk review.
- Editor atau admin memberikan satu persetujuan.
- Author tidak dapat menyetujui artikelnya sendiri.
- Artikel dapat diterbitkan langsung atau dijadwalkan.
- Perubahan penting dicatat melalui revision history dan audit log.

## Verifikasi sebelum pull request atau rilis

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

Untuk pemeriksaan API yang sedang berjalan:

```bash
pnpm --dir apps/api security:smoke
```

## Deployment

- Frontend: Vercel dengan root directory `apps/web`.
- API: container dari [`apps/api/Dockerfile`](./apps/api/Dockerfile).
- Database/Auth: project Supabase terpisah untuk staging dan production.
- Media: bucket serta access key R2 terpisah per environment.

Ikuti [Staging Runbook](./docs/STAGING_RUNBOOK.md) untuk urutan rilis, environment wajib, smoke test, dan rollback. Keputusan topologi deployment dicatat dalam [ADR-004](./docs/decisions/ADR-004-deployment-topology.md).

## Keamanan

- Jangan commit `.env`, `.env.local`, token, password, service-role key, atau R2 secret.
- Rotasi segera kredensial yang pernah terkirim melalui chat, log, atau channel tidak aman.
- Gunakan project dan bucket terpisah untuk development, staging, dan production.
- Pertahankan RLS Supabase, least privilege, validasi server, dan CORS allowlist.
- Nonaktifkan Swagger di production dengan `SWAGGER_ENABLED=false`.

Lihat [docs/SECURITY.md](./docs/SECURITY.md) untuk detail hardening dan prosedur keamanan.

## Dokumentasi tambahan

- [Product dan engineering contract](./AGENTS.md)
- [Data tier](./database/README.md)
- [Brand guidelines](./docs/brand-guidelines.md)
- [Three-tier architecture ADR](./docs/decisions/0001-three-tier-architecture.md)
- [Deployment topology ADR](./docs/decisions/ADR-004-deployment-topology.md)
- [Staging runbook](./docs/STAGING_RUNBOOK.md)

## Lisensi

Belum ada lisensi open-source yang ditetapkan. Seluruh hak proyek tetap dimiliki oleh pemilik Crypto Exist sampai file lisensi ditambahkan secara eksplisit.
