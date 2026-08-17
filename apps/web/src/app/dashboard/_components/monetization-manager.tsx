"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";

type Campaign = {
  id: string;
  name: string;
  advertiser: string;
  placement: string;
  status: "draft" | "active" | "paused" | "ended";
  startsAt: string;
  endsAt: string;
  impressionCount: number;
  clickCount: number;
};

async function accessToken() {
  return (await createClient().auth.getSession()).data.session?.access_token;
}

export function MonetizationManager() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");

  const load = useCallback(async () => {
    const access = await accessToken();
    if (!access) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/monetization/campaigns`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (response.ok) setItems(await response.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startsAt = new Date(String(form.get("startsAt")));
    const endsAt = new Date(String(form.get("endsAt")));
    const creative = form.get("creative");

    if (endsAt <= startsAt) {
      setNotice("Waktu selesai harus setelah waktu mulai.");
      const endInput = formElement.elements.namedItem("endsAt");
      if (endInput instanceof HTMLElement) endInput.focus();
      return;
    }
    if (!(creative instanceof File) || creative.size === 0) {
      setNotice("Pilih creative banner sebelum menyimpan campaign.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const access = await accessToken();
      if (!access) throw new Error("Sesi berakhir. Silakan masuk kembali.");

      setPhase("uploading");
      const signingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({ fileName: creative.name, contentType: creative.type, size: creative.size, purpose: "advertisement" }),
      });
      if (!signingResponse.ok) throw new Error("Gagal menyiapkan upload creative banner.");
      const signed = (await signingResponse.json()) as {
        uploadUrl: string;
        publicUrl: string | null;
        requiredHeaders: Record<string, string>;
      };
      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: signed.requiredHeaders,
        body: creative,
      });
      if (!uploadResponse.ok) throw new Error("Upload creative banner ke R2 gagal.");
      if (!signed.publicUrl) throw new Error("URL publik R2 belum dikonfigurasi.");

      setPhase("saving");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/monetization/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          name: form.get("name"),
          advertiser: form.get("advertiser"),
          placement: form.get("placement"),
          creativeUrl: signed.publicUrl,
          creativeAlt: form.get("creativeAlt"),
          destinationUrl: form.get("destinationUrl"),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Campaign gagal disimpan. Periksa semua field.");
      formElement.reset();
      setNotice("Campaign berhasil dibuat sebagai draft.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Campaign gagal disimpan.");
    } finally {
      setBusy(false);
      setPhase("idle");
    }
  }

  async function updateStatus(id: string, next: Campaign["status"]) {
    const access = await accessToken();
    if (!access) return setNotice("Sesi berakhir. Silakan masuk kembali.");
    setBusy(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/monetization/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({ status: next }),
      });
      setNotice(response.ok ? `Status campaign diubah menjadi ${next}.` : "Status gagal diubah.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = phase === "uploading" ? "Mengunggah ke R2…" : phase === "saving" ? "Menyimpan campaign…" : "Buat campaign";

  return (
    <section className="content-queue monetization-admin" id="monetization" aria-labelledby="monetization-heading">
      <div className="queue-heading">
        <div><p className="kicker">REVENUE DESK</p><h2 id="monetization-heading">Campaign banner</h2></div>
        <span>{items.length} campaign</span>
      </div>
      <form className="campaign-form" onSubmit={create} aria-busy={busy}>
        <label htmlFor="campaign-name">Nama campaign</label><input id="campaign-name" name="name" required minLength={3} />
        <label htmlFor="advertiser">Advertiser</label><input id="advertiser" name="advertiser" required />
        <label htmlFor="placement">Placement</label><select id="placement" name="placement"><option value="homepage_leaderboard">Homepage leaderboard</option><option value="homepage_inline">Homepage inline</option><option value="article_inline">Article inline</option><option value="article_sidebar">Article sidebar</option></select>
        <label htmlFor="creative">Creative banner</label><input id="creative" name="creative" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-describedby="creative-help" required /><small id="creative-help">JPEG, PNG, WebP, atau AVIF · maksimal 10 MB.</small>
        <label htmlFor="creativeAlt">Deskripsi visual banner</label><input id="creativeAlt" name="creativeAlt" minLength={5} maxLength={180} aria-describedby="creative-alt-help" required /><small id="creative-alt-help">Jelaskan isi banner untuk pembaca yang memakai screen reader.</small>
        <label htmlFor="destinationUrl">URL tujuan</label><input id="destinationUrl" name="destinationUrl" type="url" required />
        <label htmlFor="startsAt">Mulai</label><input id="startsAt" name="startsAt" type="datetime-local" required />
        <label htmlFor="endsAt">Selesai</label><input id="endsAt" name="endsAt" type="datetime-local" required />
        {notice ? <p className="form-notice" role="status">{notice}</p> : null}
        <button className="button-primary" disabled={busy}>{submitLabel}</button>
      </form>
      <div className="campaign-list">
        {items.length === 0 ? <p className="empty-state">Belum ada campaign banner.</p> : items.map((item) => {
          const ctr = item.impressionCount ? item.clickCount / item.impressionCount * 100 : 0;
          return <article key={item.id}><div><span className={`status status-${item.status}`}>{item.status}</span><h3>{item.name}</h3><p>{item.advertiser} · {item.placement}</p><small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.startsAt))}–{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.endsAt))}</small></div><dl><div><dt>Impresi</dt><dd>{item.impressionCount.toLocaleString("id-ID")}</dd></div><div><dt>Klik</dt><dd>{item.clickCount.toLocaleString("id-ID")}</dd></div><div><dt>CTR</dt><dd>{ctr.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</dd></div></dl><div className="queue-actions">{item.status !== "active" ? <button type="button" className="button-primary" disabled={busy} onClick={() => updateStatus(item.id, "active")}>Aktifkan</button> : <button type="button" className="button-secondary" disabled={busy} onClick={() => updateStatus(item.id, "paused")}>Jeda</button>}</div></article>;
        })}
      </div>
    </section>
  );
}
