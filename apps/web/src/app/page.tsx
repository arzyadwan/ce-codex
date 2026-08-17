import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/app/_components/article-card";
import { MarketTicker } from "@/app/_components/market-ticker";
import { NewsletterForm } from "@/app/_components/newsletter-form";
import { PublicShell } from "@/app/_components/public-shell";
import { SponsorBanner } from "@/app/_components/sponsor-banner";
import { getPublicArticles, getPublicFacets } from "@/lib/public-api";

export default async function HomePage() {
  const [result, facets] = await Promise.all([
    getPublicArticles({ limit: "10" }),
    getPublicFacets(),
  ]);
  const [featured, ...latest] = result.items;
  const breaking = result.items.find((article) => article.isBreaking);

  return (
    <PublicShell>
      {breaking ? (
        <aside className="breaking-banner" aria-label="Breaking news">
          <strong>BREAKING</strong>
          <Link href={`/artikel/${breaking.slug}`}>{breaking.title}</Link>
        </aside>
      ) : null}

      <section className={`news-hero${featured?.featuredImageUrl ? " news-hero-with-image" : ""}`}>
        {featured?.featuredImageUrl ? (
          <Image
            className="news-hero-background"
            src={featured.featuredImageUrl}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            alt=""
          />
        ) : null}
        <div className="news-hero-overlay" aria-hidden="true" />
        <div className="news-hero-copy">
          <p className="kicker">{featured?.category?.name ?? "CRYPTO EXIST"}</p>
          <h1>
            {featured ? (
              <Link href={`/artikel/${featured.slug}`}>{featured.title}</Link>
            ) : (
              "Memahami crypto tanpa kehilangan konteks."
            )}
          </h1>
          <p>{featured?.excerpt ?? "Berita independen, analisis pasar, dan edukasi Web3 dalam Bahasa Indonesia."}</p>
          <Link className="button-primary inline-button" href={featured ? `/artikel/${featured.slug}` : "/berita"}>
            Baca selengkapnya
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="hero-stories" aria-label="Berita pilihan lainnya">
            {latest.slice(0, 3).map((article) => (
              <article key={article.id}>
                <p className="kicker">{article.category?.name ?? "WEB3"}</p>
                <h2><Link href={`/artikel/${article.slug}`}>{article.title}</Link></h2>
                {article.publishedAt ? <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.publishedAt))}</time> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <nav className="taxonomy-bar" aria-label="Jelajahi kategori">
        {facets.categories.map((category) => (
          <Link key={category.slug} className="taxonomy-chip" href={`/kategori/${category.slug}`}>
            {category.name} <span>{category.count}</span>
          </Link>
        ))}
      </nav>

      <div className="home-layout">
        <section className="latest-section" aria-labelledby="latest-title">
          <div className="section-heading heading-with-link">
            <div><p className="kicker">PUBLIKASI TERBARU</p><h2 id="latest-title">Kabar yang perlu Anda pahami</h2></div>
            <Link className="text-link" href="/berita">Lihat semua berita</Link>
          </div>
          {latest.length > 0 ? (
            <div className="news-grid">{latest.map((article) => <ArticleCard article={article} key={article.id} />)}</div>
          ) : (
            <div className="empty-state"><h3>Belum ada artikel terbit</h3><p>Redaksi sedang menyiapkan publikasi pertama.</p></div>
          )}
        </section>
        <aside className="home-sidebar" aria-label="Data pasar dan newsletter">
          <MarketTicker />
          <NewsletterForm />
          <SponsorBanner />
        </aside>
      </div>
    </PublicShell>
  );
}
