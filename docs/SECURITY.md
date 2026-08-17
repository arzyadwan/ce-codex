# Security baseline

## Application tier

- Helmet mengatur HTTP security headers dan menghapus identitas Express.
- CORS hanya menerima origin eksplisit dari `CORS_ORIGIN`; wildcard tidak diterima.
- JSON dan URL-encoded body dibatasi oleh `REQUEST_BODY_LIMIT` (default `1mb`). Upload media tetap langsung ke signed URL Cloudflare R2.
- Rate limiting memiliki burst limit dan sustained limit. Health check dikecualikan untuk monitoring.
- Swagger aktif secara default hanya pada development. Production memerlukan `SWAGGER_ENABLED=true` secara eksplisit.
- `TRUST_PROXY=false` adalah default. Aktifkan hanya jika jumlah hop/reverse proxy sudah diketahui.

## Production edge

Rate limiter bawaan NestJS menyimpan counter di memori proses. Untuk deployment multi-instance, jadikan Cloudflare WAF/Rate Limiting sebagai limit utama atau gunakan storage throttler terdistribusi. Jangan membuka origin API sehingga dapat melewati Cloudflare.

## Verification

Setelah API lokal berjalan, jalankan `pnpm --dir apps/api security:smoke`.
