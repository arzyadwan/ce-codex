import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditorialWorkspace } from "./_components/editorial-workspace";

export const metadata: Metadata = { title: "Dashboard Editorial" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Image src="/logo.png" width={190} height={73} alt="Crypto Exist" priority />
      <nav aria-label="Navigasi editorial"><a className="nav-active" href="#overview">Overview</a><a href="#notifications">Notifikasi</a><a href="#write">Tulis artikel</a><a href="#taxonomy">Kategori & tag</a><a href="#monetization">Monetisasi</a><a href="#workflow">Workflow</a></nav>
      <p className="sidebar-label">CRYPTO EXIST CMS · MVP</p>
    </aside>
    <EditorialWorkspace email={typeof data.claims.email === "string" ? data.claims.email : "Anggota redaksi"} />
  </main>;
}
