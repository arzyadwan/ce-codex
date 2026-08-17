import { getMarketPrices } from "@/lib/public-api";

const usd = new Intl.NumberFormat("id-ID", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export async function MarketTicker() {
  const market = await getMarketPrices();
  if (market.items.length === 0) return null;
  return <section className="market-ticker" aria-labelledby="market-heading">
    <div className="market-ticker-heading"><div><p className="kicker">DATA PASAR</p><h2 id="market-heading">Harga aset utama</h2></div><p>Sumber: {market.source}{market.stale ? " · data terakhir tersedia" : " · diperbarui berkala"}</p></div>
    <div className="market-grid">{market.items.map((asset) => {
      const direction = (asset.change24h ?? 0) >= 0 ? "naik" : "turun";
      return <article className="market-card" key={asset.id}><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div><p className="market-price">{asset.priceUsd === null ? "—" : usd.format(asset.priceUsd)}</p><p className={`market-change market-${direction}`}><span>{direction === "naik" ? "Naik" : "Turun"}</span> {asset.change24h === null ? "—" : `${Math.abs(asset.change24h).toFixed(2)}%`} <small>24 jam</small></p></article>;
    })}</div>
    <p className="market-disclaimer">Harga bersifat informasional, dapat berbeda antar bursa, dan bukan rekomendasi investasi.</p>
  </section>;
}
