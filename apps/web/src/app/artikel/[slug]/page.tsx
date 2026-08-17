import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichTextContent, type RichTextNode } from "@/app/_components/rich-text-content";

type Article = { title: string; slug: string; excerpt: string; seoTitle: string | null; seoDescription: string | null; featuredImageUrl: string | null; publishedAt: string | null; content: RichTextNode; category: { name: string; slug: string } | null; tags: Array<{ name: string; slug: string }> };
async function getArticle(slug: string): Promise<Article | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${slug}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Artikel tidak dapat dimuat.");
  return response.json();
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  return article ? { title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, openGraph: { title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, images: article.featuredImageUrl ? [article.featuredImageUrl] : [] } } : { title: "Artikel tidak ditemukan" };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug); if (!article) notFound();
  return <main><header className="public-header"><Link href="/" className="wordmark">CRYPTO <b>EXIST</b></Link><nav><Link href="/">Berita</Link><Link href="/login">Ruang redaksi</Link></nav></header>
    <article className="article-page"><p className="kicker">CRYPTO EXIST · {article.category?.name ?? "BERITA"}</p><h1>{article.title}</h1><p className="article-deck">{article.excerpt}</p><p className="article-meta">Diterbitkan {article.publishedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(article.publishedAt)) : "hari ini"}</p>{article.tags.length > 0 && <div className="news-card-tags" aria-label="Tag artikel">{article.tags.map((tag) => <Link key={tag.slug} href={`/?tag=${tag.slug}#latest`}>#{tag.name}</Link>)}</div>}
      {article.featuredImageUrl && <figure className="article-hero"><Image src={article.featuredImageUrl} alt={`Featured image untuk ${article.title}`} fill sizes="(max-width: 900px) 100vw, 1100px" priority /></figure>}
      <div className="article-body"><RichTextContent document={article.content} /></div>
    </article></main>;
}
