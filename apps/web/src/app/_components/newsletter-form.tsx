"use client";
import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "on" }) });
      setState(response.ok ? "success" : "error"); if (response.ok) event.currentTarget.reset();
    } catch { setState("error"); }
  }
  return <section className="newsletter" aria-labelledby="newsletter-title"><div><p className="kicker">RINGKASAN PILIHAN REDAKSI</p><h2 id="newsletter-title">Tetap paham, tanpa tenggelam dalam noise.</h2><p>Dapatkan berita dan edukasi pilihan Crypto Exist. Anda dapat berhenti berlangganan kapan saja.</p></div><form onSubmit={submit}><label htmlFor="newsletter-email">Alamat email</label><div className="newsletter-row"><input id="newsletter-email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" /><button className="button-primary" disabled={state === "loading"}>{state === "loading" ? "Mengirim…" : "Berlangganan"}</button></div><label className="consent"><input name="consent" type="checkbox" required /> Saya setuju menerima newsletter Crypto Exist.</label><p className="newsletter-status" aria-live="polite">{state === "success" ? "Berhasil. Selamat datang di newsletter Crypto Exist." : state === "error" ? "Pendaftaran belum berhasil. Periksa email dan coba lagi." : ""}</p></form></section>;
}
