import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/app/_components/public-shell";
import { getPublicFacets } from "@/lib/public-api";
export const metadata: Metadata = { title: "Tim Penulis", description: "Kenali penulis dan kontributor editorial Crypto Exist." };
export default async function AuthorsPage() { const authors=(await getPublicFacets()).authors; return <PublicShell><header className="archive-hero"><p className="kicker">REDAKSI</p><h1>Penulis Crypto Exist</h1><p>Jurnalis dan kontributor yang membantu pembaca memahami industri aset digital.</p></header><section className="directory-grid">{authors.length ? authors.map((author)=><article className="directory-card" key={author.username}><div className="avatar" aria-hidden="true">{author.displayName.slice(0,1).toUpperCase()}</div><h2><Link href={`/penulis/${author.username}`}>{author.displayName}</Link></h2><p>@{author.username}</p><span>{author.count} artikel terbit</span></article>) : <div className="empty-state"><h2>Profil penulis belum tersedia</h2><p>Profil akan tampil setelah artikel pertama diterbitkan.</p></div>}</section></PublicShell>; }
