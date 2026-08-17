import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/app/_components/article-card";
import { NewsletterForm } from "@/app/_components/newsletter-form";
import { PublicShell } from "@/app/_components/public-shell";
import { getPublicArticles, getPublicFacets } from "@/lib/public-api";

export default async function HomePage() {
  const [result, facets] = await Promise.all([getPublicArticles({ limit: "7" }), getPublicFacets()]);
  const [featured, ...latest] = result.items;
  const breaking = result.items.find((article) => article.isBreaking);
  return <PublicShell>
    {breaking ? <aside className="breaking-banner" aria-label="Breaking news"><strong>BREAKING</strong><Link href={`/artikel/${breaking.slug}`}>{breaking.title}</Link></aside> : null}
    <section className="news-hero">{featured ? <><div className="news-hero-copy"><p className="kicker">BERITA UTAMA</p><h1><Link href={`/artikel/${featured.slug}`}>{featured.title}</Link></h1><p>{featured.excerpt}</p><Link className="button-primary inline-button" href={`/artikel/${featured.slug}`}>Baca selengkapnya</Link></div>{featured.featuredImageUrl && <div className="news-hero-image"><Image src={featured.featuredImageUrl} fill priority sizes="(max-width: 900px) 100vw, 50vw" alt={`Ilustrasi berita: ${featured.title}`} /></div>}</> : <div className="news-hero-copy"><p className="kicker">CRYPTO EXIST</p><h1>Memahami crypto tanpa kehilangan konteks.</h1><p>Berita independen, analisis pasar, dan edukasi Web3 dalam Bahasa Indonesia.</p><Link className="button-primary inline-button" href="/berita">Jelajahi berita</Link></div>}</section>
    <nav className="taxonomy-bar" aria-label="Jelajahi kategori">{facets.categories.map((category) => <Link key={category.slug} className="taxonomy-chip" href={`/kategori/${category.slug}`}>{category.name} <span>{category.count}</span></Link>)}</nav>
    <section className="latest-section"><div className="section-heading heading-with-link"><div><p className="kicker">PUBLIKASI TERBARU</p><h2>Kabar yang perlu Anda pahami</h2></div><Link className="text-link" href="/berita">Lihat semua berita</Link></div>{latest.length > 0 ? <div className="news-grid">{latest.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : <div className="empty-state"><h3>Belum ada artikel terbit</h3><p>Redaksi sedang menyiapkan publikasi pertama.</p></div>}</section>
    <NewsletterForm />
  </PublicShell>;
}
