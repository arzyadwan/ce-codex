import postgres from "postgres";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Seed demo ditolak pada production. Set ALLOW_DEMO_SEED=true hanya jika benar-benar disengaja.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum dikonfigurasi.");

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const tags = [
  ["Bitcoin", "bitcoin"],
  ["Ethereum", "ethereum"],
  ["DeFi", "defi"],
  ["Keamanan", "keamanan"],
  ["Pemula", "pemula"],
];
const articles = [
  {
    title: "Bitcoin Memasuki Fase Konsolidasi: Apa yang Perlu Diperhatikan?",
    slug: "demo-bitcoin-fase-konsolidasi",
    excerpt: "Memahami konsolidasi harga Bitcoin, indikator yang relevan, dan risiko yang perlu diperhatikan tanpa terjebak prediksi berlebihan.",
    category: "analisis",
    tags: ["bitcoin"],
    featured: true,
    breaking: false,
    daysAgo: 0,
  },
  {
    title: "Panduan Pertama Menggunakan Wallet Crypto dengan Aman",
    slug: "demo-panduan-wallet-crypto-aman",
    excerpt: "Langkah praktis memilih wallet, menyimpan seed phrase, dan menghindari modus phishing yang umum menargetkan pengguna baru.",
    category: "edukasi",
    tags: ["keamanan", "pemula"],
    featured: false,
    breaking: false,
    daysAgo: 1,
  },
  {
    title: "Ethereum dan Perkembangan Ekosistem Layer 2",
    slug: "demo-ethereum-ekosistem-layer-2",
    excerpt: "Gambaran ringkas mengenai peran Layer 2 dalam meningkatkan kapasitas transaksi dan pengalaman pengguna Ethereum.",
    category: "web3-defi",
    tags: ["ethereum", "defi"],
    featured: true,
    breaking: false,
    daysAgo: 2,
  },
  {
    title: "Protokol DeFi Mendorong Transparansi Risiko Smart Contract",
    slug: "demo-defi-transparansi-risiko",
    excerpt: "Pelaku industri mulai memperjelas audit, mekanisme oracle, dan risiko likuiditas agar pengguna dapat menilai protokol secara lebih kritis.",
    category: "berita-pasar",
    tags: ["defi", "keamanan"],
    featured: false,
    breaking: true,
    daysAgo: 0,
  },
  {
    title: "Mengenal Blockchain: Catatan Digital yang Dikelola Bersama",
    slug: "demo-mengenal-blockchain",
    excerpt: "Penjelasan sederhana tentang blok, transaksi, konsensus, dan alasan jaringan blockchain dapat beroperasi tanpa satu pengelola pusat.",
    category: "edukasi",
    tags: ["pemula"],
    featured: false,
    breaking: false,
    daysAgo: 3,
  },
];

function documentFor(article) {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: article.excerpt }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Konteks utama" }] },
      { type: "paragraph", content: [{ type: "text", text: "Artikel demo ini disiapkan untuk menguji tata letak, pencarian, kategori, tag, serta alur publikasi Crypto Exist." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hal yang perlu diperhatikan" }] },
      { type: "bulletList", content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Periksa sumber primer dan waktu publikasi informasi." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bedakan fakta, analisis, dan opini." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Kelola risiko dan lakukan riset mandiri." }] }] },
      ] },
    ],
  };
}

try {
  const [author] = await sql`select id from public.profiles where role = 'author' order by created_at limit 1`;
  if (!author) throw new Error("Profil author belum tersedia. Buat akun author sebelum menjalankan seed demo.");

  await sql.begin(async (tx) => {
    for (const [name, slug] of tags) {
      await tx`insert into public.tags (name, slug) values (${name}, ${slug}) on conflict (slug) do update set name = excluded.name`;
    }

    for (const article of articles) {
      const [category] = await tx`select id from public.categories where slug = ${article.category}`;
      if (!category) throw new Error(`Kategori ${article.category} tidak ditemukan.`);
      const publishedAt = new Date(Date.now() - article.daysAgo * 86_400_000);
      const [saved] = await tx`
        insert into public.articles (
          author_id, title, slug, excerpt, seo_title, seo_description, category_id, content,
          status, is_featured, is_breaking, submitted_at, published_at, updated_at
        ) values (
          ${author.id}, ${article.title}, ${article.slug}, ${article.excerpt}, ${article.title},
          ${article.excerpt}, ${category.id}, ${sql.json(documentFor(article))}, 'published',
          ${article.featured}, ${article.breaking}, ${publishedAt}, ${publishedAt}, now()
        )
        on conflict (slug) do update set
          title = excluded.title,
          excerpt = excluded.excerpt,
          seo_title = excluded.seo_title,
          seo_description = excluded.seo_description,
          category_id = excluded.category_id,
          content = excluded.content,
          status = excluded.status,
          is_featured = excluded.is_featured,
          is_breaking = excluded.is_breaking,
          published_at = excluded.published_at,
          updated_at = now()
        returning id
      `;
      await tx`delete from public.article_tags where article_id = ${saved.id}`;
      for (const tagSlug of article.tags) {
        await tx`
          insert into public.article_tags (article_id, tag_id)
          select ${saved.id}, id from public.tags where slug = ${tagSlug}
          on conflict do nothing
        `;
      }
    }
  });

  const [result] = await sql`
    select count(*)::int as count
    from public.articles
    where slug like 'demo-%'
  `;
  console.log(`DEMO_ARTICLES=${result.count}`);
  console.log(`DEMO_TAGS=${tags.length}`);
  console.log("DEMO_SEED=SUCCESS");
} finally {
  await sql.end();
}
