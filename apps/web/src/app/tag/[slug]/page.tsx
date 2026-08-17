import type { Metadata } from "next";
import { ArticleArchive } from "@/app/_components/article-archive";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const slug=(await params).slug; return { title: `#${slug}`, description: `Artikel Crypto Exist dengan tag ${slug}.`, robots: { index: false, follow: true } }; }
export default async function TagPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) { const slug=(await params).slug; return <ArticleArchive title={`#${slug}`} description="Kumpulan artikel berdasarkan topik pilihan redaksi." filters={{tag:slug}} search={(await searchParams).page} basePath={`/tag/${slug}`} />; }
