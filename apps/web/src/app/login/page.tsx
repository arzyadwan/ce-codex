import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Masuk Editorial" };

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-labelledby="brand-heading">
        <Link href="/" aria-label="Kembali ke beranda Crypto Exist"><Image src="/logo.png" width={260} height={100} alt="Crypto Exist" priority /></Link>
        <div><p className="kicker">EDITORIAL COMMAND CENTER</p><h1 id="brand-heading">Berita yang bergerak secepat industri.</h1><p>Kelola riset, review, dan publikasi Crypto Exist dalam satu alur yang disiplin.</p></div>
        <p className="auth-footnote">Independen · Akurat · Bertanggung jawab</p>
      </section>
      <section className="auth-panel" aria-labelledby="login-heading">
        <div className="auth-card"><p className="kicker">AKSES TIM</p><h2 id="login-heading">Masuk ke ruang redaksi</h2><p className="muted">Gunakan akun author, editor, atau admin Anda.</p><LoginForm /></div>
      </section>
    </main>
  );
}
