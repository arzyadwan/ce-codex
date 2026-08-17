# Data Tier

Schema PostgreSQL dikelola dengan Drizzle migrations dari Application Tier. Supabase menyediakan PostgreSQL dan Auth; Cloudflare R2 menyimpan media.

- Migration tidak destruktif secara default.
- Gunakan constraint dan index berdasarkan pola akses.
- Approval artikel cukup satu dari editor atau admin dan selalu dicatat.
- Jangan menyimpan secret R2 atau Supabase service role di database atau browser.

# Editorial notifications

`notifications` menyimpan inbox internal untuk setiap profil redaksi. Tabel memiliki indeks penerima/status baca, deduplikasi event, RLS aktif, dan tidak diekspos kepada role browser. NestJS menyediakan daftar 20 notifikasi terbaru, jumlah belum dibaca, serta aksi tandai satu/semua dibaca.

Event yang dicatat: permintaan review untuk editor/admin, permintaan revisi untuk penulis, persetujuan terjadwal, publikasi langsung, dan publikasi otomatis oleh Cron.
# Scheduled publishing

`scheduled-publishing.sql` installs an idempotent private publisher function and a Supabase Cron job named `crypto-exist-publish-due`. The job runs every minute. The API keeps its request-time fallback so overdue content is still recovered if Cron is temporarily unavailable.
