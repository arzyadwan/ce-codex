# ADR-004: Deployment topology

- Status: accepted
- Date: 2026-08-17

## Context

Crypto Exist menggunakan Next.js, NestJS, Supabase PostgreSQL/Auth, dan Cloudflare R2 dalam monorepo pnpm/Turborepo. Presentation Tier memerlukan integrasi native Next.js, sedangkan Application Tier memerlukan proses Node jangka panjang yang portable.

## Decision

- Deploy `apps/web` sebagai project Next.js di Vercel.
- Deploy `apps/api` sebagai OCI container dari build context root repository.
- Gunakan Supabase sebagai layanan data/Auth dan Cloudflare R2 sebagai object storage; keduanya tidak dikemas dalam container.
- Jalankan perubahan schema sebagai tahap terpisah sebelum promosi artifact aplikasi.
- Gunakan preview/staging untuk smoke test, kemudian promosikan artifact yang sama ke production.

## Consequences

- Vercel harus mengikutsertakan source di luar `apps/web` karena web bergantung pada `packages/contracts`.
- API container bersifat stateless; rate limiting lintas instance harus ditangani di edge atau storage terdistribusi.
- Secret dikelola di platform deployment dan tidak masuk image atau repository.
- Rollback aplikasi tidak otomatis me-rollback schema; migration harus backward-compatible.
