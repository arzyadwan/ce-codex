import Link from "next/link";
import { ArticleCard } from "./article-card";
import { PublicShell } from "./public-shell";
import { getPublicArticles } from "@/lib/public-api";

export async function ArticleArchive({ title, description, filters, search, basePath }: { title: string; description: string; filters?: Record<string, string>; search?: string; basePath: string }) {
  const page = search && /^\d+$/.test(search) ? search : "1";
  const result = await getPublicArticles({ ...filters, page });
  const href = (target: number) => `${basePath}?page=${target}`;
  return <PublicShell><header className="archive-hero"><p className="kicker">ARSIP CRYPTO EXIST</p><h1>{title}</h1><p>{description}</p></header><section className="latest-section"><div className="section-heading"><p className="kicker">{result.pagination.total} ARTIKEL</p><h2>Publikasi terbaru</h2></div>{result.items.length ? <><div className="news-grid">{result.items.map((article) => <ArticleCard key={article.id} article={article} />)}</div>{result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Navigasi halaman"><Link aria-disabled={result.pagination.page <= 1} className={result.pagination.page <= 1 ? "pagination-disabled" : ""} href={href(Math.max(1, result.pagination.page - 1))}>Sebelumnya</Link><span>Halaman {result.pagination.page} dari {result.pagination.totalPages}</span><Link aria-disabled={result.pagination.page >= result.pagination.totalPages} className={result.pagination.page >= result.pagination.totalPages ? "pagination-disabled" : ""} href={href(Math.min(result.pagination.totalPages, result.pagination.page + 1))}>Berikutnya</Link></nav>}</> : <div className="empty-state"><h3>Belum ada artikel</h3><p>Coba jelajahi kategori lain atau kembali lagi setelah redaksi menerbitkan konten baru.</p><Link className="text-link" href="/berita">Lihat seluruh berita</Link></div>}</section></PublicShell>;
}
