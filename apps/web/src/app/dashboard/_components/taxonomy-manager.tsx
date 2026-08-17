"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";

type Category = { id: string; name: string; slug: string; description: string | null; usageCount: number };
type Tag = { id: string; name: string; slug: string; usageCount: number };

export function TaxonomyManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [notice, setNotice] = useState("Memuat taksonomi…");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);
  async function token() { return (await createClient().auth.getSession()).data.session?.access_token; }
  async function load() {
    const accessToken = await token(); if (!accessToken) return setNotice("Sesi admin berakhir.");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taxonomy`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return setNotice((await response.json()).message ?? "Taksonomi tidak dapat dimuat.");
    const data = await response.json() as { categories: Category[]; tags: Tag[] };
    setCategories(data.categories); setTags(data.tags); setNotice("");
  }
  async function updateCategory(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setBusyId(id); setNotice("");
    const form = new FormData(event.currentTarget); const accessToken = await token();
    try {
      if (!accessToken) throw new Error("Sesi admin berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taxonomy/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ name: form.get("name"), description: form.get("description") || undefined }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Kategori gagal diperbarui.");
      setNotice("Kategori berhasil diperbarui."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Kategori gagal diperbarui."); }
    finally { setBusyId(null); }
  }
  async function deleteTag(tag: Tag) {
    if (tag.usageCount > 0) return;
    setBusyId(tag.id); setNotice("");
    try {
      const accessToken = await token(); if (!accessToken) throw new Error("Sesi admin berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taxonomy/tags/${tag.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error((await response.json()).message ?? "Tag gagal dihapus.");
      setNotice(`Tag ${tag.name} berhasil dihapus.`); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Tag gagal dihapus."); }
    finally { setBusyId(null); }
  }

  return <section className="content-queue taxonomy-admin" id="taxonomy" aria-labelledby="taxonomy-heading"><div className="queue-heading"><div><p className="kicker">ADMIN CONTROL</p><h2 id="taxonomy-heading">Kategori & tag</h2></div><span>{categories.length} kategori · {tags.length} tag</span></div>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <div className="category-admin-grid">{categories.map((category) => <form key={category.id} onSubmit={(event) => updateCategory(event, category.id)}><span className="status">{category.usageCount} artikel</span><label htmlFor={`category-name-${category.id}`}>Nama kategori</label><input id={`category-name-${category.id}`} name="name" defaultValue={category.name} minLength={3} maxLength={60} required /><label htmlFor={`category-description-${category.id}`}>Deskripsi</label><textarea id={`category-description-${category.id}`} name="description" defaultValue={category.description ?? ""} maxLength={240} rows={3} /><small>Slug tetap: {category.slug}</small><button className="button-primary" disabled={busyId === category.id}>{busyId === category.id ? "Menyimpan…" : "Simpan kategori"}</button></form>)}</div>
    <div className="tag-admin-list" aria-label="Daftar tag">{tags.length === 0 ? <p className="empty-state">Belum ada tag artikel.</p> : tags.map((tag) => <div key={tag.id}><div><strong>#{tag.name}</strong><small>{tag.usageCount} artikel · {tag.slug}</small></div><button className="button-secondary" disabled={tag.usageCount > 0 || busyId === tag.id} title={tag.usageCount > 0 ? "Tag masih digunakan artikel" : "Hapus tag yang tidak digunakan"} onClick={() => deleteTag(tag)}>{busyId === tag.id ? "Menghapus…" : "Hapus"}</button></div>)}</div>
  </section>;
}
