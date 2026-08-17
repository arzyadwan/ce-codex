# Crypto Exist — Instruksi Pengembangan untuk Codex

Dokumen ini adalah sumber instruksi utama bagi Codex dan kontributor yang membangun Crypto Exist. Baca seluruh dokumen sebelum merencanakan atau mengubah kode. Jika instruksi pengguna terbaru bertentangan dengan dokumen ini, ikuti instruksi pengguna dan dokumentasikan keputusan yang berubah.

## 1. Ringkasan Produk

**Crypto Exist** adalah platform media dan berita independen berbahasa Indonesia yang berfokus pada aset kripto, teknologi blockchain, Web3, dan decentralized finance (DeFi).

Produk harus membantu pembaca:

- memperoleh berita industri dan pasar secara cepat dan akurat;
- memahami konsep kripto dari tingkat dasar sampai lanjut;
- membaca analisis yang transparan, berbasis sumber, dan tidak menyesatkan;
- mengikuti perkembangan Bitcoin, Ethereum, altcoin, DeFi, NFT, regulasi, keamanan, dan inovasi blockchain;
- berinteraksi dengan komunitas secara aman pada fase pengembangan berikutnya.

Crypto Exist adalah media informasi, bukan penasihat keuangan. Jangan membuat fitur, teks, atau pola desain yang menjanjikan keuntungan investasi.

## 2. Prinsip Produk

Urutan prioritas produk:

1. Kredibilitas dan ketepatan informasi.
2. Keamanan pembaca, editor, dan data.
3. Pengalaman membaca yang cepat dan nyaman pada perangkat seluler.
4. SEO teknis dan kemudahan penemuan konten.
5. Kemudahan kerja redaksi.
6. Aksesibilitas dan kompatibilitas lintas perangkat.
7. Kemudahan pemeliharaan kode.

Jika ada konflik antara kecepatan publikasi dan kredibilitas, prioritaskan kredibilitas.

## 3. Pengguna Utama

### Pembaca pemula

Membutuhkan penjelasan sederhana, glosarium, navigasi edukasi yang jelas, dan peringatan risiko.

### Pembaca berpengalaman

Membutuhkan berita cepat, analisis lebih dalam, referensi sumber primer, kategori, tag, dan pencarian yang baik.

### Penulis dan editor

Membutuhkan alur draft, review, revisi, penjadwalan, publikasi, pengelolaan media, metadata SEO, dan audit perubahan.

### Administrator

Membutuhkan pengelolaan pengguna dan peran, moderasi, konfigurasi situs, serta jejak audit.

## 4. Sasaran MVP

MVP harus menyediakan:

- beranda editorial;
- halaman daftar artikel dan detail artikel;
- kategori dan tag;
- artikel unggulan dan breaking news;
- pencarian artikel;
- halaman penulis;
- panel redaksi untuk draft, review, jadwal terbit, publikasi, dan arsip;
- pengelolaan gambar utama dan media artikel;
- SEO metadata, canonical URL, sitemap XML, robots.txt, RSS, Open Graph, dan structured data;
- newsletter opt-in;
- halaman Tentang, Kontak, Kebijakan Privasi, Kebijakan Editorial, Koreksi, dan Disclaimer;
- desain mobile-first, accessible, dan memiliki loading, empty, error, serta not-found state.

### Di luar MVP

Jangan implementasikan tanpa permintaan eksplisit:

- forum komunitas;
- komentar pembaca;
- direct message;
- trading, custody, atau koneksi dompet;
- rekomendasi investasi personal;
- paywall atau pembayaran;
- publikasi artikel otomatis oleh AI;
- aplikasi seluler native.

Simpan fitur tersebut untuk fase lanjutan karena memerlukan moderasi, kebijakan, keamanan, dan ruang lingkup tambahan.

## 5. Taksonomi Konten Awal

Kategori utama:

- Berita
- Analisis
- Edukasi
- Bitcoin
- Ethereum
- Altcoin
- DeFi
- NFT & Web3
- Regulasi
- Keamanan

Jenis editorial wajib dapat dibedakan secara visual dan pada metadata:

- berita faktual;
- analisis;
- opini;
- edukasi;
- siaran pers;
- konten sponsor.

Jangan membuat kategori dan tag baru yang maknanya tumpang tindih tanpa mengevaluasi taksonomi yang sudah ada.

## 6. Keputusan Teknologi

Keputusan berikut telah dikonfirmasi pemilik proyek:

- Next.js App Router;
- TypeScript dengan strict mode;
- React Server Components sebagai default;
- Tailwind CSS;
- shadcn/ui untuk primitive antarmuka yang relevan;
- arsitektur three-tier dan monorepo Turborepo dengan pnpm;
- Next.js sebagai Presentation Tier;
- NestJS REST API `/v1` sebagai Application Tier;
- Supabase PostgreSQL dan Drizzle ORM sebagai Data Tier;
- Supabase Auth dengan email/password, Google OAuth opsional, dan MFA untuk editor/admin sebelum produksi;
- Cloudflare R2 sebagai object storage melalui signed URL dari API;
- Vercel untuk frontend dan container service untuk API;
- Vitest untuk unit/integration test;
- Playwright untuk end-to-end test;
- structured rich-text JSON untuk konten artikel;
- layanan email transaksional seperti Resend;
- analytics yang menghormati privasi.

MVP berbahasa Indonesia tetapi harus siap multilingual. Artikel cukup membutuhkan satu persetujuan dari editor atau admin; author biasa tidak dapat menyetujui artikelnya sendiri. Jangan mengganti stack inti tanpa persetujuan.

## 7. Arsitektur Aplikasi

Gunakan arsitektur modular berdasarkan domain. Hindari satu folder global yang menampung seluruh komponen, query, atau utilitas tanpa batas domain.

Contoh struktur sasaran:

```text
src/
  app/
    (public)/
    (editorial)/
    api/
  components/
    ui/
    layout/
  features/
    articles/
    authors/
    categories/
    search/
    newsletter/
    editorial/
  lib/
    auth/
    db/
    validation/
    seo/
    security/
  styles/
  types/
tests/
  e2e/
  fixtures/
docs/
```

Aturan arsitektur:

- Server Component adalah default; gunakan Client Component hanya jika diperlukan untuk state, event browser, atau browser API.
- Akses database dan secret hanya dari server.
- Pisahkan logika domain dari komponen presentasi.
- Validasi input pada batas sistem, terutama Server Action, route handler, webhook, dan form.
- Hindari duplikasi tipe antara database, API, dan UI jika dapat diturunkan secara aman.
- Gunakan fungsi kecil dengan nama yang menjelaskan maksud.
- Jangan membuat abstraction sebelum ada kebutuhan nyata dan pola berulang.
- Jangan mengakses database langsung dari banyak komponen UI; gunakan lapisan query/service per domain.

## 8. Model Data Konseptual

Model awal:

### `profiles`

- `id`
- `display_name`
- `username`
- `bio`
- `avatar_url`
- `role`
- `created_at`
- `updated_at`

Peran awal: `admin`, `editor`, `author`.

### `articles`

- `id`
- `title`
- `slug`
- `excerpt`
- `content`
- `featured_image_id`
- `author_id`
- `editor_id`
- `content_type`
- `status`
- `is_featured`
- `is_breaking`
- `published_at`
- `scheduled_at`
- `created_at`
- `updated_at`
- `seo_title`
- `seo_description`
- `canonical_url`
- `disclosure`

Status awal: `draft`, `in_review`, `scheduled`, `published`, `archived`.

### Model pendukung

- `article_revisions`
- `categories`
- `article_categories`
- `tags`
- `article_tags`
- `media`
- `article_sources`
- `newsletter_subscribers`
- `audit_logs`

Aturan data:

- Gunakan UUID atau strategi ID konsisten yang tidak dapat ditebak untuk resource sensitif.
- Semua waktu disimpan dalam UTC dan ditampilkan sesuai zona pengguna; default editorial adalah `Asia/Jakarta`.
- Slug harus unik, stabil, dan memiliki strategi redirect jika berubah.
- Gunakan constraint database untuk invariant penting, bukan hanya validasi UI.
- Migration harus dapat ditinjau, kecil, dan tidak destruktif secara default.
- Jangan menyimpan secret, seed phrase, private key, atau data dompet pengguna.
- Jangan memakai floating-point untuk nilai finansial. Gunakan decimal presisi tetap atau unit integer terkecil jika fitur finansial kelak ditambahkan.

## 9. Alur Editorial

Alur utama:

```text
Draft -> Review Editor -> Dijadwalkan/Diterbitkan -> Diperbarui -> Diarsipkan
```

Ketentuan:

- Author membuat dan memperbarui draft miliknya.
- Editor dapat mereview, meminta revisi, menjadwalkan, dan menerbitkan.
- Admin mengelola akses, konfigurasi, dan seluruh konten.
- Artikel terbit mencatat penulis, editor jika relevan, waktu terbit, waktu pembaruan, sumber, dan disclosure.
- Koreksi material harus transparan dan dicatat.
- Konten sponsor dan siaran pers harus diberi label yang jelas.
- Artikel AI-generated tidak boleh diterbitkan otomatis; manusia bertanggung jawab atas verifikasi dan persetujuan akhir.

## 10. Persyaratan Halaman Publik

### Beranda

- headline utama;
- breaking news bila ada;
- artikel terbaru;
- artikel pilihan editor;
- kelompok konten berdasarkan kategori;
- CTA newsletter;
- tidak padat secara berlebihan pada layar kecil.

### Detail artikel

- judul dan ringkasan;
- jenis konten;
- penulis dan profil singkat;
- tanggal terbit dan pembaruan;
- estimasi waktu baca;
- gambar utama dengan alt text;
- isi artikel yang mudah dibaca;
- kategori dan tag;
- daftar sumber;
- disclosure dan disclaimer jika relevan;
- tombol berbagi yang tidak mengganggu privasi;
- artikel terkait;
- breadcrumb;
- structured data yang sesuai.

### Pencarian dan arsip

- pencarian berdasarkan judul, ringkasan, dan isi yang sudah dipublikasikan;
- filter kategori, tag, penulis, dan rentang tanggal bila dibutuhkan;
- pagination yang stabil;
- empty state yang membantu;
- parameter URL dapat dibagikan dan dirayapi secara tepat.

## 11. Design System dan UX

Karakter visual: modern, kredibel, tegas, teknologi, tetapi bukan tampilan kasino atau skema cepat kaya.

Aturan:

- mobile-first;
- gunakan token untuk warna, spacing, radius, typography, dan shadow;
- pertahankan kontras minimum WCAG AA;
- semua kontrol dapat digunakan dengan keyboard;
- focus state harus terlihat;
- gambar wajib memiliki ukuran eksplisit untuk mencegah layout shift;
- hormati `prefers-reduced-motion`;
- animasi harus mendukung pemahaman, bukan dekorasi berlebihan;
- jangan menggunakan warna saja untuk menyampaikan status;
- gunakan bahasa Indonesia yang jelas dan konsisten;
- hindari dark pattern, urgency palsu, dan indikator harga yang menyesatkan.

## 12. SEO dan Distribusi

Setiap halaman publik harus memiliki metadata yang relevan. Artikel harus mendukung:

- title dan description unik;
- canonical URL;
- Open Graph dan Twitter/X card;
- `NewsArticle` atau `Article` JSON-LD yang valid;
- breadcrumb structured data;
- author, `datePublished`, dan `dateModified`;
- sitemap yang hanya memasukkan URL canonical dan layak diindeks;
- RSS feed;
- redirect permanen untuk slug lama;
- halaman 404 yang benar;
- kebijakan index/noindex yang eksplisit untuk pencarian, preview, admin, dan draft.

Jangan melakukan keyword stuffing, membuat halaman tipis secara massal, atau menyamarkan konten buatan AI.

## 13. Kredibilitas dan Standar Editorial

- Utamakan sumber primer: pengumuman resmi, dokumentasi proyek, data on-chain tepercaya, filing regulator, dan pernyataan langsung.
- Pisahkan fakta, interpretasi, prediksi, dan opini.
- Jangan mengarang kutipan, angka, sumber, atau referensi.
- Angka pasar harus menyebut sumber data dan waktu pengambilan.
- Analisis harga harus memuat disclaimer bahwa konten bukan nasihat keuangan.
- Konflik kepentingan, afiliasi, kepemilikan aset relevan, dan sponsor harus diungkapkan.
- Sediakan mekanisme koreksi dan kontak redaksi.
- Jangan menyalin artikel pihak lain. Kutipan harus singkat, relevan, dan memiliki atribusi.
- Untuk breaking news, tampilkan waktu pembaruan dan perbarui konteks secara transparan.

## 14. Keamanan

Keamanan wajib menjadi bagian desain, bukan pekerjaan akhir.

- Terapkan least privilege pada role dan database.
- Aktifkan dan uji Row Level Security pada semua tabel yang terekspos melalui Supabase.
- Tolak akses secara default.
- Validasi serta normalisasi semua input di server.
- Sanitasi rich text/HTML dengan allowlist yang ketat sebelum dirender.
- Jangan menggunakan `dangerouslySetInnerHTML` tanpa sanitasi yang teruji.
- Verifikasi jenis, ukuran, ekstensi, dan signature file upload.
- Gunakan nama file acak dan storage policy terbatas.
- Lindungi endpoint sensitif dari CSRF, abuse, brute force, dan spam sesuai model ancaman.
- Terapkan rate limit pada login, pencarian berat, newsletter, kontak, dan endpoint publik yang rentan.
- Jangan memasukkan secret ke source code, log, browser bundle, fixture, atau dokumentasi.
- Gunakan environment variable tervalidasi di server.
- Jangan mencatat token, password, session, atau data pribadi pada log.
- Header keamanan dan Content Security Policy harus dikonfigurasi secara bertahap dan diuji.
- Dependency harus diaudit; jangan melakukan upgrade mayor tanpa membaca migration guide dan menjalankan seluruh verifikasi.

Perubahan auth, policy database, upload, migration produksi, dan penghapusan data memerlukan review ekstra.

## 15. Privasi dan Kepatuhan

- Kumpulkan data pribadi seminimal mungkin.
- Newsletter harus memakai persetujuan eksplisit dan menyediakan unsubscribe.
- Jangan mengaktifkan tracker non-esensial tanpa dasar persetujuan yang sesuai.
- Dokumentasikan tujuan, retensi, dan penghapusan data.
- Jangan memberikan klaim kepatuhan hukum tanpa review pihak yang kompeten.
- Perlakukan kebijakan privasi dan cookie sebagai kebutuhan produk, bukan teks generik yang tidak sesuai implementasi.

## 16. Performa

Target awal pada halaman publik representatif:

- Lighthouse Performance, Accessibility, Best Practices, dan SEO minimal 90 pada kondisi pengujian yang disepakati;
- Core Web Vitals berada pada kategori baik;
- JavaScript sisi klien dijaga sekecil mungkin;
- font dan gambar dioptimalkan;
- konten artikel dapat dibaca tanpa menunggu hydration kompleks;
- query database menghindari N+1 dan memiliki index berdasarkan pola akses nyata;
- caching memiliki strategi invalidasi yang jelas ketika artikel diterbitkan atau diperbarui.

Jangan mengoptimalkan berdasarkan dugaan. Ukur bundle, query, dan pengalaman halaman penting.

## 17. Aksesibilitas

- Gunakan HTML semantik dan landmark yang benar.
- Setiap input memiliki label.
- Error form terhubung dengan field dan dapat dipahami screen reader.
- Heading tersusun hierarkis.
- Modal, menu, dan dialog mengelola fokus dengan benar.
- Target sentuh cukup besar.
- Video/audio, jika kelak digunakan, memiliki caption atau transkrip.
- Lakukan pengujian keyboard dan automated accessibility check; automated check tidak menggantikan review manual.

## 18. API, Error, dan Observability

- Gunakan format error yang konsisten tanpa membocorkan detail internal.
- Pesan pengguna harus jelas; detail teknis masuk ke log aman.
- Setiap operasi mutasi harus menangani authorization, validation, success, failure, dan retry/idempotency jika relevan.
- Webhook harus memverifikasi signature dan aman terhadap pengiriman ulang.
- Tambahkan structured logging dan error monitoring sebelum produksi.
- Gunakan correlation/request ID bila dibutuhkan untuk menelusuri insiden.
- Jangan menampilkan stack trace atau konfigurasi server kepada pengguna.

## 19. Strategi Pengujian

Gunakan test pyramid yang proporsional:

- unit test untuk fungsi domain, parser, validator, dan utilitas;
- integration test untuk query, policy, route handler, serta alur editorial;
- end-to-end test untuk perjalanan kritis pengguna.

Alur E2E minimum:

1. Pembaca membuka beranda dan artikel terbit.
2. Pembaca mencari dan memfilter artikel.
3. Pengguna tanpa izin tidak dapat membuka panel redaksi.
4. Author membuat dan mengirim draft untuk review.
5. Editor mereview dan menerbitkan atau menjadwalkan artikel.
6. Artikel terbit tampil pada halaman publik dan metadata SEO benar.
7. Subscriber mendaftar dan berhenti berlangganan newsletter.

Test harus deterministik. Jangan mengandalkan API eksternal langsung dalam unit test. Gunakan fixture/factory yang mudah dibaca dan jangan menaruh secret pada fixture.

## 20. Workflow Codex

Untuk setiap tugas implementasi:

1. Baca dokumen ini dan instruksi lokal lain yang berlaku.
2. Periksa struktur repository, dependency, pola kode, dan status Git.
3. Nyatakan asumsi penting secara singkat.
4. Untuk perubahan besar, buat rencana kecil dengan hasil yang dapat diverifikasi.
5. Implementasikan perubahan terkecil yang menyelesaikan acceptance criteria.
6. Jangan mengubah file yang tidak terkait atau menimpa pekerjaan pengguna.
7. Tambahkan atau perbarui test yang relevan.
8. Jalankan formatter, lint, typecheck, test, dan build yang tersedia.
9. Lakukan pemeriksaan UI pada viewport mobile dan desktop untuk perubahan visual.
10. Ringkas hasil, file penting, hasil verifikasi, dan risiko tersisa.

Jika repository masih kosong, mulai dari dokumentasi keputusan dan scaffold minimum. Jangan mengimplementasikan seluruh produk dalam satu perubahan besar.

## 21. Aturan Perubahan Kode

- Ikuti style dan pola repository yang sudah ada.
- TypeScript harus tetap strict; hindari `any`, assertion berlebihan, dan penonaktifan lint tanpa alasan kuat.
- Jangan menghapus atau mengganti implementasi yang tidak terkait tugas.
- Jangan mengubah kontrak API, schema, atau environment variable secara diam-diam.
- Jangan membuat fallback yang menyembunyikan error konfigurasi.
- Jangan hardcode URL produksi, credential, harga, atau data pasar dinamis.
- Jangan menjalankan migration destruktif tanpa persetujuan dan rencana rollback.
- Jangan melakukan deploy, publish, commit, push, atau menghubungi pihak luar kecuali diminta.
- Komentar kode menjelaskan alasan atau constraint, bukan mengulang sintaks.
- Dokumentasikan keputusan arsitektur penting pada `docs/decisions/` sebagai ADR.

## 22. Environment dan Konfigurasi

Saat scaffold dibuat, sediakan `.env.example` yang hanya memuat nama dan penjelasan variabel, tanpa nilai rahasia. Validasi environment ketika aplikasi dimulai.

Kelompok konfigurasi minimum yang mungkin diperlukan:

```text
PUBLIC_APP_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  # server only
EMAIL_PROVIDER_API_KEY     # server only
EMAIL_FROM
```

Gunakan nama aktual sesuai library yang dipilih. Jangan mengekspos service-role key atau API key privat melalui prefix public.

## 23. Tahapan Implementasi

### Fase 0 — Discovery dan keputusan

- konfirmasi target audiens dan tujuan bisnis;
- konfirmasi stack;
- tentukan brand direction;
- buat sitemap dan content model;
- buat ADR untuk keputusan besar;
- definisikan metrik keberhasilan.

### Fase 1 — Fondasi

- scaffold aplikasi;
- konfigurasi TypeScript, lint, formatter, test, dan CI;
- design tokens dan layout dasar;
- koneksi database dan migration awal;
- auth, role, dan policy;
- seed data development yang aman.

### Fase 2 — Pengalaman membaca

- beranda;
- halaman artikel;
- kategori, tag, penulis, dan arsip;
- pencarian;
- responsive design dan accessibility;
- metadata SEO, sitemap, RSS, dan structured data.

### Fase 3 — Sistem editorial

- dashboard;
- editor artikel;
- draft, review, schedule, publish, archive;
- media library;
- revision history dan audit log;
- preview draft yang aman.

### Fase 4 — Distribusi dan kepercayaan

- newsletter;
- halaman kebijakan;
- disclosure dan koreksi;
- analytics dan observability;
- optimasi performa.

### Fase 5 — Hardening dan rilis

- audit auth, RLS, upload, sanitasi, dan dependency;
- pengujian E2E;
- accessibility review;
- performance budget;
- backup dan pemulihan;
- staging, smoke test, dan production checklist.

### Fase lanjutan

- komentar atau forum dengan moderasi;
- bookmark dan personalisasi;
- notifikasi;
- data pasar real-time;
- monetisasi yang diberi label transparan.

Setiap fase harus selesai dan dapat diuji sebelum fase berikutnya diperluas.

## 24. Definition of Ready

Sebuah tugas siap dikerjakan jika:

- tujuan dan pengguna yang terdampak jelas;
- ruang lingkup dan hal di luar ruang lingkup jelas;
- acceptance criteria dapat diuji;
- dependency dan risiko utama diketahui;
- desain atau perilaku responsif dijelaskan untuk pekerjaan UI;
- perubahan schema/API memiliki rencana kompatibilitas.

## 25. Definition of Done

Sebuah fitur selesai hanya jika:

- acceptance criteria terpenuhi;
- authorization dan validation sudah diterapkan;
- loading, empty, error, unauthorized, dan not-found state yang relevan ditangani;
- UI responsif dan dapat digunakan dengan keyboard;
- metadata/SEO diperbarui jika halaman publik berubah;
- test relevan ditambahkan dan lulus;
- formatter, lint, typecheck, test, dan production build lulus;
- tidak ada error console penting;
- dokumentasi, `.env.example`, migration, dan ADR diperbarui bila perlu;
- tidak ada secret atau data sensitif dalam perubahan;
- perubahan telah diperiksa pada alur nyata, bukan hanya secara statis;
- risiko atau pekerjaan lanjutan dilaporkan dengan jujur.

## 26. Quality Gates Sebelum Rilis

- seluruh CI lulus;
- migration diuji pada data non-produksi dan memiliki prosedur rollback;
- RLS dan role diuji dengan akun berbeda;
- draft dan preview tidak dapat diindeks atau diakses tanpa izin;
- sanitasi konten dan upload telah diuji;
- sitemap, canonical, RSS, dan structured data tervalidasi;
- halaman kritis lolos smoke test mobile dan desktop;
- backup, monitoring, alert, dan prosedur insiden tersedia;
- kebijakan editorial, privasi, disclaimer, dan koreksi sesuai implementasi aktual;
- tidak ada placeholder, credential, atau data dummy yang bocor ke produksi.

## 27. Metrik Keberhasilan Awal

Jangan mengejar page view dengan mengorbankan kualitas. Pantau secara etis:

- waktu muat dan Core Web Vitals;
- keberhasilan pencarian;
- newsletter conversion dan unsubscribe;
- pembaca kembali;
- kedalaman baca;
- error rate;
- waktu dari draft ke publikasi;
- jumlah koreksi material;
- artikel dengan sumber dan metadata lengkap.

Metrik final harus dikonfirmasi pemilik produk sebelum instrumentation produksi.

## 28. Pertanyaan yang Harus Diklarifikasi

Catat jawaban pada ADR atau dokumen produk sebelum keputusan menjadi permanen:

1. Apakah MVP hanya berbahasa Indonesia atau harus siap multilingual?
2. Apakah desain/brand guideline dan aset logo sudah tersedia?
3. Siapa saja peran redaksi dan aturan persetujuannya?
4. Apakah editor konten menggunakan Markdown, rich text, atau block editor?
5. Provider data pasar, email, analytics, dan error monitoring apa yang dipilih?
6. Apakah artikel sponsor diizinkan dan bagaimana proses persetujuannya?
7. Apakah data lokasi atau data pribadi lain perlu dikumpulkan?
8. Target tanggal, anggaran layanan, traffic, dan SLA berapa?
9. Apakah komentar/forum masuk roadmap dan siapa moderatornya?
10. Domain produksi serta strategi migrasi konten lama seperti apa?

Jika jawaban belum tersedia, gunakan pilihan yang paling sederhana dan reversibel, tandai asumsi, dan hindari komitmen arsitektur yang mahal.

## 29. Format Handoff Codex

Setiap penyelesaian tugas harus melaporkan:

```text
Hasil:
- hasil yang dapat digunakan pengguna

Perubahan utama:
- file atau modul penting yang berubah

Verifikasi:
- command dan hasil lint/typecheck/test/build
- pemeriksaan UI atau alur yang dilakukan

Asumsi/risiko tersisa:
- keputusan provisional, risiko, atau tindak lanjut
```

Jangan menyatakan tugas selesai jika verifikasi yang relevan belum dijalankan. Jika verifikasi tidak dapat dilakukan, jelaskan alasannya secara spesifik.

## 30. Instruksi Awal untuk Sesi Pertama Codex

Gunakan perintah berikut sebagai titik awal:

```text
Baca AGENTS.md seluruhnya dan perlakukan sebagai kontrak pengembangan.
Periksa kondisi repository tanpa mengubah file terlebih dahulu.
Susun rencana implementasi Fase 0 dan Fase 1, termasuk keputusan yang masih
memerlukan konfirmasi. Jangan membangun semua fitur sekaligus.

Setelah rencana disetujui, scaffold fondasi aplikasi dengan perubahan kecil dan
terverifikasi. Untuk setiap tahap, jalankan formatter, lint, typecheck, test,
dan build yang tersedia. Jangan deploy, membuat layanan berbayar, atau mengubah
sistem eksternal tanpa persetujuan eksplisit.
```
