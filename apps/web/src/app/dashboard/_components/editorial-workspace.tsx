"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { TaxonomyManager } from "./taxonomy-manager";
import { NotificationCenter } from "./notification-center";
import { MonetizationManager } from "./monetization-manager";

type Profile = { displayName: string; username: string; role: "author" | "editor" | "admin" };
type Article = { id: string; title: string; slug: string; excerpt: string; status: "draft" | "changes_requested" | "in_review" | "scheduled" | "published" | "archived"; authorId: string; updatedAt: string; publishedAt: string | null; latestRevision?: { note: string; createdAt: string; resolvedAt: string | null } | null };

export function EditorialWorkspace({ email }: { email: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [mine, setMine] = useState<Article[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Article[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  useEffect(() => { void loadProfile(); }, []);
  async function token() { return (await createClient().auth.getSession()).data.session?.access_token; }
  async function loadProfile() {
    const accessToken = await token(); if (!accessToken) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.ok) {
      const payload = await response.json() as { user: { id: string }; profile: Profile | null };
      const current = payload.profile;
      setUserId(payload.user.id);
      setProfile(current);
      await loadArticles(accessToken, current?.role);
    }
  }
  async function loadArticles(accessToken: string, role?: Profile["role"]) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const mineRequest = fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/mine`, { headers });
    const queueRequest = role === "editor" || role === "admin" ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/review-queue`, { headers }) : Promise.resolve(null);
    const [mineResponse, queueResponse] = await Promise.all([mineRequest, queueRequest]);
    if (mineResponse.ok) setMine(await mineResponse.json());
    if (queueResponse?.ok) setReviewQueue(await queueResponse.json());
  }
  async function transition(articleId: string, action: "submit" | "approve") {
    setActionId(articleId); setNotice("");
    try {
      const accessToken = await token(); if (!accessToken) throw new Error("Sesi berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${articleId}/${action}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: "{}" });
      if (!response.ok) throw new Error((await response.json()).message ?? "Perubahan status gagal.");
      setNotice(action === "submit" ? "Artikel dikirim ke antrean review." : "Artikel disetujui dan diterbitkan.");
      await loadArticles(accessToken, profile?.role);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Perubahan status gagal."); }
    finally { setActionId(null); }
  }
  async function requestRevision(articleId: string) {
    if (revisionNote.trim().length < 10) return setNotice("Catatan revisi minimal 10 karakter.");
    setActionId(articleId); setNotice("");
    try {
      const accessToken = await token(); if (!accessToken) throw new Error("Sesi berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${articleId}/request-changes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ note: revisionNote }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Permintaan revisi gagal.");
      setNotice("Artikel dikembalikan kepada penulis dengan catatan revisi."); setRevisionTarget(null); setRevisionNote("");
      await loadArticles(accessToken, profile?.role);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Permintaan revisi gagal."); }
    finally { setActionId(null); }
  }
  async function scheduleArticle(articleId: string) {
    if (!scheduleAt) return setNotice("Pilih waktu publikasi terlebih dahulu.");
    setActionId(articleId); setNotice("");
    try {
      const accessToken = await token(); if (!accessToken) throw new Error("Sesi berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${articleId}/schedule`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ publishAt: new Date(scheduleAt).toISOString() }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Penjadwalan gagal.");
      setNotice("Artikel disetujui dan dijadwalkan untuk publikasi."); setScheduleTarget(null); setScheduleAt("");
      await loadArticles(accessToken, profile?.role);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Penjadwalan gagal."); }
    finally { setActionId(null); }
  }
  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setNotice("");
    const form = new FormData(event.currentTarget); const accessToken = await token();
    const title = String(form.get("title"));
    try {
      if (!accessToken) throw new Error("Sesi berakhir. Silakan masuk kembali.");
      const image = form.get("featuredImage");
      let featuredImageUrl: string | undefined;
      if (image instanceof File && image.size > 0) {
        const signingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload-url`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ fileName: image.name, contentType: image.type, size: image.size }) });
        if (!signingResponse.ok) throw new Error("Gagal menyiapkan upload featured image.");
        const signed = await signingResponse.json() as { uploadUrl: string; publicUrl: string | null; requiredHeaders: Record<string, string> };
        const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", headers: signed.requiredHeaders, body: image });
        if (!uploadResponse.ok) throw new Error("Upload featured image ke R2 gagal.");
        if (!signed.publicUrl) throw new Error("R2_PUBLIC_BASE_URL belum dikonfigurasi.");
        featuredImageUrl = signed.publicUrl;
      }
      const sources = String(form.get("sources") ?? "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [sourceTitle, url, publisher] = line.split("|").map((part) => part.trim()); return { title: sourceTitle, url, ...(publisher ? { publisher } : {}) }; });
      const payload = { title, slug: String(form.get("slug")), excerpt: String(form.get("excerpt")), featuredImageUrl, categorySlug: form.get("categorySlug") || undefined, tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), contentType: String(form.get("contentType") ?? "news"), sources, sponsorName: form.get("sponsorName") || undefined, sponsorUrl: form.get("sponsorUrl") || undefined, sponsorDisclosure: form.get("sponsorDisclosure") || undefined, affiliateDisclosure: form.get("affiliateDisclosure") || undefined, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: String(form.get("content")) }] }] } };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Draft gagal disimpan.");
      event.currentTarget.reset(); setNotice("Draft berhasil disimpan dan siap dikembangkan."); await loadArticles(accessToken, profile?.role);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Draft gagal disimpan."); }
    finally { setPending(false); }
  }
  async function signOut() { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }

  return <section className="dashboard-main">
    <header className="dashboard-topbar"><div><p className="kicker">RUANG REDAKSI</p><h1 id="overview">Selamat bekerja, {profile?.displayName ?? email}</h1></div><div className="profile-actions"><span className="role-badge">{profile?.role ?? "memuat role"}</span><button className="button-secondary" onClick={signOut}>Keluar</button></div></header>
    <div className="metric-grid" aria-label="Ringkasan editorial"><article><span>01</span><h2>Draft aktif</h2><p>Mulai dari ide, lengkapi sumber, lalu kirim review.</p></article><article><span>02</span><h2>Satu persetujuan</h2><p>Editor atau admin menerbitkan setelah pemeriksaan.</p></article><article><span>03</span><h2>Audit tercatat</h2><p>Setiap perubahan penting tersimpan di application tier.</p></article></div>
    <NotificationCenter />
    <section className="editor-panel" id="write"><div className="editor-intro"><p className="kicker">DRAFT BARU</p><h2>Tulis dengan konteks, bukan sensasi.</h2><p>Gunakan judul yang informatif, ringkasan yang menjawab inti berita, dan isi yang dapat diverifikasi.</p></div>
      <form className="editor-form" onSubmit={createDraft}>
        <label htmlFor="title">Judul artikel</label><input id="title" name="title" minLength={10} maxLength={180} required />
        <label htmlFor="slug">Slug URL</label><input id="slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required placeholder="bitcoin-menembus-level-baru" />
        <label htmlFor="excerpt">Ringkasan</label><textarea id="excerpt" name="excerpt" minLength={20} maxLength={320} rows={3} required />
        <label htmlFor="categorySlug">Kategori utama</label><select id="categorySlug" name="categorySlug"><option value="">Pilih kategori</option><option value="berita-pasar">Berita Pasar</option><option value="analisis">Analisis</option><option value="edukasi">Edukasi</option><option value="web3-defi">Web3 & DeFi</option></select>
        <label htmlFor="contentType">Jenis konten</label><select id="contentType" name="contentType" defaultValue="news"><option value="news">Berita</option><option value="analysis">Analisis</option><option value="opinion">Opini</option><option value="education">Edukasi</option><option value="press_release">Siaran pers</option><option value="sponsored">Konten sponsor</option></select><small className="field-help">Konten sponsor dan siaran pers akan diberi label yang terlihat oleh pembaca.</small>
        <label htmlFor="tags">Tag artikel</label><input id="tags" name="tags" placeholder="Bitcoin, Ethereum, Regulasi" aria-describedby="new-tags-help" /><small id="new-tags-help" className="field-help">Pisahkan dengan koma, maksimal 8 tag.</small>
        <label htmlFor="sources">Sumber dan referensi</label><textarea id="sources" name="sources" rows={4} placeholder="Judul sumber | https://sumber.example | Nama penerbit" aria-describedby="sources-help" /><small id="sources-help" className="field-help">Satu sumber per baris. Format: judul | URL | penerbit (opsional).</small>
        <fieldset className="commercial-fields"><legend>Transparansi komersial</legend><label htmlFor="sponsorName">Nama sponsor</label><input id="sponsorName" name="sponsorName" maxLength={120} /><label htmlFor="sponsorUrl">URL sponsor</label><input id="sponsorUrl" name="sponsorUrl" type="url" /><label htmlFor="sponsorDisclosure">Disclosure sponsor</label><textarea id="sponsorDisclosure" name="sponsorDisclosure" minLength={20} maxLength={1000} rows={3} /><label htmlFor="affiliateDisclosure">Disclosure afiliasi</label><textarea id="affiliateDisclosure" name="affiliateDisclosure" minLength={20} maxLength={1000} rows={3} /></fieldset>
        <label htmlFor="featuredImage">Featured image</label><input id="featuredImage" name="featuredImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-describedby="featured-help" /><small id="featured-help" className="field-help">JPEG, PNG, WebP, atau AVIF · maksimal 10 MB.</small>
        <label htmlFor="content">Isi awal</label><textarea id="content" name="content" rows={8} required />
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <button className="button-primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan sebagai draft"}</button>
      </form>
    </section>
    <section className="content-queue" aria-labelledby="my-articles-heading"><div className="queue-heading"><div><p className="kicker">WORKSPACE</p><h2 id="my-articles-heading">Artikel saya</h2></div><span>{mine.length} artikel</span></div>
      {mine.length === 0 ? <p className="empty-state">Belum ada artikel. Buat draft pertama dari form di atas.</p> : <div className="article-list">{mine.map((article) => <article className="queue-card" key={article.id}><div><span className={`status status-${article.status}`}>{article.status.replaceAll("_", " ")}</span><h3>{article.title}</h3><p>{article.excerpt}</p>{article.status === "changes_requested" && article.latestRevision && <blockquote className="revision-callout"><strong>Catatan editor</strong><p>{article.latestRevision.note}</p></blockquote>}{article.status === "scheduled" && article.publishedAt && <p className="schedule-note">Terbit otomatis {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(article.publishedAt))}</p>}</div><div className="queue-actions">{(article.status === "draft" || article.status === "changes_requested") && <><Link className="text-link" href={`/dashboard/articles/${article.id}/edit`}>{article.status === "changes_requested" ? "Perbaiki artikel" : "Edit & pratinjau"}</Link><button className="button-primary" disabled={actionId === article.id} onClick={() => transition(article.id, "submit")}>{actionId === article.id ? "Mengirim…" : article.status === "changes_requested" ? "Kirim ulang" : "Kirim review"}</button></>}{article.status === "published" && <a className="text-link" href={`/artikel/${article.slug}`}>Lihat publikasi</a>}</div></article>)}</div>}
    </section>
    {(profile?.role === "editor" || profile?.role === "admin") && <section className="content-queue review-queue" aria-labelledby="review-heading"><div className="queue-heading"><div><p className="kicker">EDITOR DESK</p><h2 id="review-heading">Antrean review</h2></div><span>{reviewQueue.length} menunggu</span></div>
      {reviewQueue.length === 0 ? <p className="empty-state">Tidak ada artikel yang menunggu persetujuan.</p> : <div className="article-list">{reviewQueue.map((article) => <article className="queue-card" key={article.id}><div><span className="status status-in_review">Perlu review</span><h3>{article.title}</h3><p>{article.excerpt}</p>{revisionTarget === article.id && <div className="revision-form"><label htmlFor={`revision-${article.id}`}>Catatan yang harus diperbaiki</label><textarea id={`revision-${article.id}`} value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} minLength={10} maxLength={1000} rows={4} /><div><button className="button-secondary" onClick={() => { setRevisionTarget(null); setRevisionNote(""); }}>Batal</button><button className="button-primary" disabled={actionId === article.id || revisionNote.trim().length < 10} onClick={() => requestRevision(article.id)}>Kirim catatan revisi</button></div></div>}{scheduleTarget === article.id && <div className="revision-form schedule-form"><label htmlFor={`schedule-${article.id}`}>Waktu publikasi</label><input id={`schedule-${article.id}`} type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} /><small>Waktu mengikuti zona waktu perangkat Anda.</small><div><button className="button-secondary" onClick={() => { setScheduleTarget(null); setScheduleAt(""); }}>Batal</button><button className="button-primary" disabled={!scheduleAt || actionId === article.id} onClick={() => scheduleArticle(article.id)}>Setujui & jadwalkan</button></div></div>}</div><div className="queue-actions"><Link className="text-link" href={`/dashboard/articles/${article.id}/edit`}>Baca & pratinjau</Link><button className="button-secondary" disabled={article.authorId === userId} onClick={() => { setRevisionTarget(article.id); setScheduleTarget(null); }}>Minta revisi</button><button className="button-secondary" disabled={article.authorId === userId} onClick={() => { setScheduleTarget(article.id); setRevisionTarget(null); }}>Jadwalkan</button><button className="button-primary" title={article.authorId === userId ? "Penulis tidak boleh menyetujui artikelnya sendiri" : undefined} disabled={actionId === article.id || article.authorId === userId} onClick={() => transition(article.id, "approve")}>{actionId === article.id ? "Menerbitkan…" : "Setujui & terbitkan"}</button></div></article>)}</div>}
    </section>}
    {profile?.role === "admin" && <TaxonomyManager />}
    {profile?.role === "admin" && <MonetizationManager />}
    <section className="workflow-strip" id="workflow" aria-label="Alur publikasi"><b>DRAFT</b><span>→</span><b>IN REVIEW</b><span>↔</span><b>REVISION</b><span>→</span><b>1× APPROVAL</b><span>→</span><b>PUBLISHED</b></section>
  </section>;
}
