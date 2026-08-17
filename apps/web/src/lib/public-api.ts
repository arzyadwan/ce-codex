export type PublicAuthor = { displayName: string; username: string };
export type ArticleSource = { title: string; url: string; publisher?: string };
export type PublicArticle = { id: string; title: string; slug: string; excerpt: string; featuredImageUrl: string | null; publishedAt: string | null; updatedAt?: string; seoTitle?: string | null; seoDescription?: string | null; isFeatured: boolean; isBreaking: boolean; contentType: "news" | "analysis" | "opinion" | "education" | "press_release" | "sponsored"; sources: ArticleSource[]; sponsorName?: string | null; sponsorUrl?: string | null; sponsorDisclosure?: string | null; affiliateDisclosure?: string | null; category: { name: string; slug: string } | null; author: PublicAuthor | null; tags: Array<{ name: string; slug: string }> };
export type MarketAsset = { id: string; symbol: string; name: string; priceUsd: number | null; priceIdr: number | null; change24h: number | null; marketCapUsd: number | null; updatedAt: string | null };
export type ArticlePageResult = { items: PublicArticle[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type PublicFacets = { categories: Array<{ name: string; slug: string; description: string | null; count: number }>; tags: Array<{ name: string; slug: string; count: number }>; authors: Array<PublicAuthor & { count: number }> };

const emptyResult: ArticlePageResult = { items: [], pagination: { page: 1, limit: 9, total: 0, totalPages: 1 } };

export async function getPublicArticles(filters: Record<string, string | undefined> = {}): Promise<ArticlePageResult> {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles?${params}`, { next: { revalidate: 60, tags: ["articles"] } });
    return response.ok ? response.json() : emptyResult;
  } catch { return emptyResult; }
}

export async function getPublicFacets(): Promise<PublicFacets> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/facets`, { next: { revalidate: 300, tags: ["facets"] } });
    return response.ok ? response.json() : { categories: [], tags: [], authors: [] };
  } catch { return { categories: [], tags: [], authors: [] }; }
}

export async function getMarketPrices(): Promise<{ items: MarketAsset[]; source: string; stale?: boolean }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/market/prices`, { next: { revalidate: 60, tags: ["market-prices"] } });
    return response.ok ? response.json() : { items: [], source: "CoinGecko", stale: true };
  } catch { return { items: [], source: "CoinGecko", stale: true }; }
}
