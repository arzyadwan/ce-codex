import Image from "next/image";
import Link from "next/link";
import type { PublicArticle } from "@/lib/public-api";

export function ArticleCard({ article }: { article: PublicArticle }) {
  return <article className="news-card">{article.featuredImageUrl && <Link className="news-card-image" href={`/artikel/${article.slug}`} tabIndex={-1} aria-hidden="true"><Image src={article.featuredImageUrl} fill sizes="(max-width: 700px) 100vw, 33vw" alt="" /></Link>}<p className="kicker">{article.category?.name ?? "BLOCKCHAIN · WEB3"}</p><h3><Link href={`/artikel/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><div className="card-byline">{article.author && <Link href={`/penulis/${article.author.username}`}>Oleh {article.author.displayName}</Link>}{article.publishedAt && <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.publishedAt))}</time>}</div>{article.tags.length > 0 && <div className="news-card-tags" aria-label="Tag artikel">{article.tags.map((tag) => <Link key={tag.slug} href={`/tag/${tag.slug}`}>#{tag.name}</Link>)}</div>}</article>;
}
