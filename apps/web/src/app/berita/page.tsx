import type { Metadata } from "next";
import { ArticleArchive } from "@/app/_components/article-archive";
export const metadata: Metadata = { title: "Berita Crypto Terbaru", description: "Berita, analisis, dan edukasi terbaru seputar cryptocurrency, blockchain, Web3, dan DeFi." };
export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) { return <ArticleArchive title="Berita crypto terbaru" description="Kabar pasar dan perkembangan industri yang diverifikasi serta disajikan dengan konteks." search={(await searchParams).page} basePath="/berita" />; }
