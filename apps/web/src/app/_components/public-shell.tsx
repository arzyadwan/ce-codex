import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return <header className="public-header"><Link href="/" className="wordmark" aria-label="Crypto Exist — Beranda"><Image src="/logo.png" width={168} height={54} alt="Crypto Exist" priority /></Link><nav aria-label="Navigasi utama"><Link href="/berita">Berita</Link><Link href="/kategori/analisis">Analisis</Link><Link href="/kategori/edukasi">Edukasi</Link><Link href="/penulis">Penulis</Link><Link href="/tentang">Tentang</Link><Link className="nav-search" href="/cari">Cari</Link></nav></header>;
}

export function PublicFooter() {
  return <footer className="public-footer"><div><Link href="/" className="footer-brand">CRYPTO <b>EXIST</b></Link><p>Media independen untuk memahami crypto, blockchain, Web3, dan DeFi secara jernih.</p><p className="footer-disclaimer">Informasi di situs ini bukan nasihat keuangan.</p></div><nav aria-label="Informasi perusahaan"><strong>Crypto Exist</strong><Link href="/tentang">Tentang kami</Link><Link href="/kontak">Kontak</Link><Link href="/penulis">Tim penulis</Link></nav><nav aria-label="Kebijakan"><strong>Kepercayaan</strong><Link href="/kebijakan-editorial">Kebijakan editorial</Link><Link href="/koreksi">Kebijakan koreksi</Link><Link href="/privasi">Privasi</Link><Link href="/disclaimer">Disclaimer</Link></nav></footer>;
}

export function PublicShell({ children }: { children: React.ReactNode }) { return <><a className="skip-link" href="#main-content">Lewati ke konten utama</a><PublicHeader /><main id="main-content" tabIndex={-1}>{children}</main><PublicFooter /></>; }
