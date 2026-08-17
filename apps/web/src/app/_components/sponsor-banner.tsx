"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
type Banner = { id: string; advertiser: string; creativeUrl: string; creativeAlt: string; destinationUrl: string };
export function SponsorBanner({ placement = "homepage_leaderboard" }: { placement?: string }) {
  const [banner, setBanner] = useState<Banner | null>(null); const root = useRef<HTMLDivElement>(null); const session = useRef(crypto.randomUUID());
  const track = (type: "impression" | "click", id: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}/monetization/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: id, type, sessionId: session.current }), keepalive: true });
  useEffect(() => { fetch(`${process.env.NEXT_PUBLIC_API_URL}/monetization/banner/${placement}`).then((response) => response.ok ? response.json() : null).then(setBanner).catch(() => setBanner(null)); }, [placement]);
  useEffect(() => { if (!banner || !root.current) return; let sent = false; const observer = new IntersectionObserver(([entry]) => { if (!sent && entry?.isIntersecting && entry.intersectionRatio >= .5) { sent = true; void track("impression", banner.id); observer.disconnect(); } }, { threshold: .5 }); observer.observe(root.current); return () => observer.disconnect(); }, [banner]);
  if (!banner) return null;
  return <aside ref={root} className="sponsor-banner" aria-label={`Iklan dari ${banner.advertiser}`}><span>Sponsored</span><a href={banner.destinationUrl} target="_blank" rel="sponsored nofollow noopener" onClick={() => void track("click", banner.id)}><Image src={banner.creativeUrl} alt={banner.creativeAlt} width={1200} height={180} sizes="(max-width: 1280px) 100vw, 1200px" /></a></aside>;
}
