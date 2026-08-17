import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleArchive } from "@/app/_components/article-archive";
import { getPublicFacets } from "@/lib/public-api";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const slug=(await params).slug; const category=(await getPublicFacets()).categories.find((item)=>item.slug===slug); return category ? { title: category.name, description: category.description ?? `Artikel terbaru dalam kategori ${category.name}.` } : { title: "Kategori tidak ditemukan" }; }
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) { const slug=(await params).slug; const category=(await getPublicFacets()).categories.find((item)=>item.slug===slug); if(!category) notFound(); return <ArticleArchive title={category.name} description={category.description ?? `Artikel dan kabar terbaru dalam kategori ${category.name}.`} filters={{category:slug}} search={(await searchParams).page} basePath={`/kategori/${slug}`} />; }
