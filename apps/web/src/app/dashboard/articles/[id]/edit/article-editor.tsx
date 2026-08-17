"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RichTextContent, type RichTextNode } from "@/app/_components/rich-text-content";
import { createClient } from "@/lib/supabase/browser";

type Article = { id: string; title: string; slug: string; excerpt: string; seoTitle: string | null; seoDescription: string | null; status: string; content: RichTextNode; category: { slug: string; name: string } | null; tags: Array<{ name: string; slug: string }>; canEdit: boolean; revisionNotes: Array<{ id: string; note: string; requestedBy: string; createdAt: string; resolvedAt: string | null }> };

export function ArticleEditor({ articleId }: { articleId: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [notice, setNotice] = useState("Memuat draft…");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const articleRef = useRef<Article | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const editor = useEditor({ extensions: [StarterKit], content: article?.content ?? { type: "doc", content: [{ type: "paragraph" }] }, immediatelyRender: false, onUpdate: scheduleAutosave });

  useEffect(() => { void load(); }, [articleId]);
  useEffect(() => { articleRef.current = article; }, [article]);
  useEffect(() => { if (article && editor) editor.commands.setContent(article.content, { emitUpdate: false }); }, [article?.id, editor]);
  useEffect(() => () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); }, []);

  async function accessToken() { return (await createClient().auth.getSession()).data.session?.access_token; }
  async function load() {
    const token = await accessToken();
    if (!token) return setNotice("Sesi berakhir. Silakan masuk kembali.");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/editorial/${articleId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return setNotice((await response.json()).message ?? "Draft tidak dapat dimuat.");
    const payload = await response.json() as Article;
    setArticle(payload); setNotice(payload.status === "draft" ? "" : "Artikel ini hanya dapat dilihat karena sudah meninggalkan status draft."); setSaveStatus(payload.status === "draft" ? "Semua perubahan tersimpan." : "");
  }
  function scheduleAutosave() {
    if (!articleRef.current?.canEdit || preview) return;
    setSaveStatus("Perubahan belum disimpan…");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { if (formRef.current) void persist(formRef.current, true); }, 1800);
  }
  async function persist(formElement: HTMLFormElement, automatic: boolean) {
    if (!articleRef.current?.canEdit || !editor || !formElement.checkValidity()) return;
    if (savingRef.current) { scheduleAutosave(); return; }
    savingRef.current = true; setSaving(true); setNotice(""); setSaveStatus(automatic ? "Menyimpan otomatis…" : "Menyimpan perubahan…");
    const form = new FormData(formElement);
    const token = await accessToken();
    try {
      if (!token) throw new Error("Sesi berakhir. Silakan masuk kembali.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles/${articleId}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: form.get("title"), slug: form.get("slug"), excerpt: form.get("excerpt"), categorySlug: form.get("categorySlug") || undefined, tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), seoTitle: form.get("seoTitle") || undefined, seoDescription: form.get("seoDescription") || undefined, content: editor.getJSON() }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Perubahan gagal disimpan.");
      await response.json();
      const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      setSaveStatus(automatic ? `Tersimpan otomatis pukul ${time}.` : `Perubahan disimpan pukul ${time}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Perubahan gagal disimpan."); setSaveStatus("Autosave gagal. Gunakan tombol simpan lalu coba kembali."); }
    finally { savingRef.current = false; setSaving(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await persist(event.currentTarget, false);
  }
  function togglePreview() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (!preview && formRef.current) void persist(formRef.current, true);
    setPreview(!preview);
  }
  if (!article) return <p className="editor-loading" role="status">{notice}</p>;
  const readOnly = !article.canEdit;
  return <form ref={formRef} className="article-editor-shell" onSubmit={save}>
    <section className="article-editor-main">
      <div className="editor-mode-row"><span className={`status status-${article.status}`}>{article.status.replace("_", " ")}</span><button type="button" className="button-secondary" aria-pressed={preview} onClick={togglePreview}>{preview ? "Kembali mengedit" : "Pratinjau artikel"}</button></div>
      {preview ? <article className="editor-preview"><p className="kicker">PRATINJAU</p><h1>{article.title}</h1><p className="article-deck">{article.excerpt}</p><div className="article-body"><RichTextContent document={editor?.getJSON() as RichTextNode} /></div></article> : <>
        <label htmlFor="edit-title">Judul artikel</label><input id="edit-title" name="title" defaultValue={article.title} minLength={10} maxLength={180} required disabled={readOnly} onChange={scheduleAutosave} />
        <label htmlFor="edit-slug">Slug URL</label><input id="edit-slug" name="slug" defaultValue={article.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} required disabled={readOnly} onChange={scheduleAutosave} />
        <label htmlFor="edit-excerpt">Ringkasan</label><textarea id="edit-excerpt" name="excerpt" defaultValue={article.excerpt} minLength={20} maxLength={320} rows={4} required disabled={readOnly} onChange={scheduleAutosave} />
        <div className="taxonomy-fields"><div><label htmlFor="edit-category">Kategori utama</label><select id="edit-category" name="categorySlug" defaultValue={article.category?.slug ?? ""} disabled={readOnly} onChange={scheduleAutosave}><option value="">Pilih kategori</option><option value="berita-pasar">Berita Pasar</option><option value="analisis">Analisis</option><option value="edukasi">Edukasi</option><option value="web3-defi">Web3 & DeFi</option></select></div><div><label htmlFor="edit-tags">Tag artikel</label><input id="edit-tags" name="tags" defaultValue={article.tags.map((tag) => tag.name).join(", ")} disabled={readOnly} aria-describedby="tags-help" onChange={scheduleAutosave} /><small id="tags-help">Pisahkan dengan koma, maksimal 8 tag.</small></div></div>
        <fieldset className="rich-editor-field" disabled={readOnly}><legend>Isi artikel</legend><div className="rich-toolbar" aria-label="Pemformatan teks">
          <button type="button" aria-pressed={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong><span className="sr-only">Tebal</span></button>
          <button type="button" aria-pressed={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>I</em><span className="sr-only">Miring</span></button>
          <button type="button" aria-pressed={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" aria-pressed={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>Daftar</button>
          <button type="button" aria-pressed={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Kutipan</button>
        </div><EditorContent editor={editor} /></fieldset>
        {article.revisionNotes.length > 0 && <section className="revision-history"><p className="kicker">CATATAN REVISI</p>{article.revisionNotes.map((revision) => <article key={revision.id}><div><strong>{revision.requestedBy}</strong><time dateTime={revision.createdAt}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))}</time></div><p>{revision.note}</p><span>{revision.resolvedAt ? "Sudah ditindaklanjuti" : "Perlu diperbaiki"}</span></article>)}</section>}
      </>}
    </section>
    <aside className="article-editor-aside"><p className="kicker">SEO & DISTRIBUSI</p><label htmlFor="seo-title">Judul SEO</label><input id="seo-title" name="seoTitle" defaultValue={article.seoTitle ?? ""} maxLength={70} disabled={readOnly || preview} aria-describedby="seo-title-help" onChange={scheduleAutosave} /><small id="seo-title-help">Ideal 50–60 karakter; maksimal 70.</small><label htmlFor="seo-description">Deskripsi SEO</label><textarea id="seo-description" name="seoDescription" defaultValue={article.seoDescription ?? ""} maxLength={170} rows={5} disabled={readOnly || preview} aria-describedby="seo-description-help" onChange={scheduleAutosave} /><small id="seo-description-help">Ideal 140–160 karakter; maksimal 170.</small><div className="seo-preview"><span>cryptoexist.id</span><strong>{article.seoTitle || article.title}</strong><p>{article.seoDescription || article.excerpt}</p></div><p className="autosave-status" role="status">{saveStatus}</p>{notice && <p className="form-notice" role="alert">{notice}</p>}<button className="button-primary" disabled={readOnly || preview || saving}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button></aside>
  </form>;
}
