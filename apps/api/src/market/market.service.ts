import { Injectable, ServiceUnavailableException } from "@nestjs/common";

type CoinGeckoPrice = Record<string, { usd?: number; idr?: number; usd_24h_change?: number; usd_market_cap?: number; last_updated_at?: number }>;
type MarketAsset = { id: string; symbol: string; name: string; priceUsd: number | null; priceIdr: number | null; change24h: number | null; marketCapUsd: number | null; updatedAt: string | null };

const assets = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
];

@Injectable()
export class MarketService {
  private cache: { expiresAt: number; items: MarketAsset[] } | null = null;

  async prices() {
    if (this.cache && this.cache.expiresAt > Date.now()) return { items: this.cache.items, source: "CoinGecko", cached: true };
    const params = new URLSearchParams({ ids: assets.map((asset) => asset.id).join(","), vs_currencies: "usd,idr", include_24hr_change: "true", include_market_cap: "true", include_last_updated_at: "true" });
    const headers: Record<string, string> = { accept: "application/json" };
    if (process.env.COINGECKO_DEMO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_DEMO_API_KEY;
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`, { headers, signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      const payload = await response.json() as CoinGeckoPrice;
      const items = assets.map((asset) => {
        const value = payload[asset.id] ?? {};
        return { ...asset, priceUsd: value.usd ?? null, priceIdr: value.idr ?? null, change24h: value.usd_24h_change ?? null, marketCapUsd: value.usd_market_cap ?? null, updatedAt: value.last_updated_at ? new Date(value.last_updated_at * 1000).toISOString() : null };
      });
      this.cache = { expiresAt: Date.now() + 60_000, items };
      return { items, source: "CoinGecko", cached: false };
    } catch {
      if (this.cache) return { items: this.cache.items, source: "CoinGecko", cached: true, stale: true };
      throw new ServiceUnavailableException("Data pasar sementara tidak tersedia. Silakan coba kembali.");
    }
  }
}
