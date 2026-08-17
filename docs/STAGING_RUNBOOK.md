# Staging runbook

## 1. Quality gate lokal

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm audit --prod
```

## 2. Supabase staging

Gunakan project Supabase terpisah dari production. Terapkan schema dengan `pnpm --dir apps/api db:apply`, lalu pastikan hasilnya menunjukkan seluruh tabel/RLS aktif dan Cron sukses. Jangan mengarahkan staging ke database production.

## 3. API container

Build dari root repository, bukan dari `apps/api`:

```bash
docker build -f apps/api/Dockerfile -t crypto-exist-api:<revision> .
docker run --rm -p 4000:4000 --env-file .env.staging crypto-exist-api:<revision>
pnpm --dir apps/api security:smoke
```

Environment wajib API:

- `DATABASE_URL`
- `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, dan Supabase publishable key
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
- `CORS_ORIGIN` berisi URL preview/staging yang eksplisit
- `SWAGGER_ENABLED=false`
- `TRUST_PROXY` sesuai jumlah hop platform; jangan gunakan `true`

Expose port dari `PORT` (default `4000`) dan gunakan `/v1/health` untuk readiness/liveness. Batasi akses origin API melalui reverse proxy/Cloudflare agar rate limit edge tidak dapat dilewati.

## 4. Cloudflare R2 staging

Gunakan bucket/key terpisah. Atur CORS bucket agar hanya origin frontend staging yang dapat melakukan `PUT` dengan header `Content-Type`. Public base URL hanya boleh menunjuk domain media staging. Jangan memasukkan API token Cloudflare ke frontend.

## 5. Vercel frontend

Import repository sebagai project baru dengan:

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Include source files outside Root Directory: enabled
- Build Command: gunakan `vercel.json`
- Install Command dan Output Directory: automatic

Environment Vercel preview/staging:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL` dengan suffix `/v1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`

Jangan menambahkan `DATABASE_URL`, Supabase service-role/secret, atau kredensial R2 privat ke project frontend.

## 6. Urutan rilis

1. Backup/restore point database staging.
2. Terapkan schema backward-compatible dan jalankan verifier.
3. Deploy API container berdasarkan revision immutable.
4. Jalankan health, security smoke, dan editorial smoke.
5. Deploy Vercel preview dari revision yang sama.
6. Uji login, draft → review → revisi → jadwal/terbit, upload R2, notifikasi, dan artikel publik.
7. Promosikan preview yang sudah diuji; jangan rebuild artifact berbeda.

## 7. Rollback

- Frontend: promosikan kembali deployment Vercel terakhir yang sehat.
- API: arahkan service ke image tag/digest terakhir yang sehat.
- Database: jangan rollback destruktif secara otomatis. Gunakan forward-fix atau prosedur rollback migration yang sudah diuji.
- R2: media yang sudah diunggah tidak dihapus oleh rollback aplikasi.
