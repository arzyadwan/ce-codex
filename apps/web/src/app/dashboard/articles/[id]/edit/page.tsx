import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditor } from "./article-editor";

export const metadata: Metadata = { title: "Edit draft | Crypto Exist" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const { id } = await params;
  return <main className="editor-page">
    <header className="editor-page-header"><div><p className="kicker">RUANG REDAKSI</p><h1>Edit artikel</h1></div><Link className="button-secondary" href="/dashboard">Kembali ke dashboard</Link></header>
    <ArticleEditor articleId={id} />
  </main>;
}
