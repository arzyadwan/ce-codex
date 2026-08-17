import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Crypto Exist", template: "%s | Crypto Exist" },
  description: "Media independen untuk berita, analisis, dan edukasi crypto, blockchain, Web3, dan DeFi.",
  applicationName: "Crypto Exist",
  openGraph: { type: "website", locale: "id_ID", siteName: "Crypto Exist" },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
