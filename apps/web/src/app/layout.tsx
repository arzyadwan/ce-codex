import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Crypto Exist", template: "%s | Crypto Exist" },
  description: "Media independen untuk berita, analisis, dan edukasi crypto, blockchain, Web3, dan DeFi.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
