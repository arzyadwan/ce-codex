"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Notification = {
  id: string; type: string; title: string; message: string; articleId: string | null;
  articleSlug: string | null; readAt: string | null; createdAt: string;
};

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);

  async function accessToken() {
    return (await createClient().auth.getSession()).data.session?.access_token;
  }

  async function load() {
    setError("");
    try {
      const token = await accessToken();
      if (!token) throw new Error("Sesi berakhir.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Notifikasi belum dapat dimuat.");
      const payload = await response.json() as { items: Notification[]; unreadCount: number };
      setItems(payload.items); setUnreadCount(payload.unreadCount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Notifikasi belum dapat dimuat.");
    } finally { setLoading(false); }
  }

  async function markRead(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.readAt) return;
    const token = await accessToken(); if (!token) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const readAt = new Date().toISOString();
      setItems((current) => current.map((entry) => entry.id === id ? { ...entry, readAt } : entry));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  }

  async function markAllRead() {
    const token = await accessToken(); if (!token) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const readAt = new Date().toISOString();
      setItems((current) => current.map((entry) => ({ ...entry, readAt: entry.readAt ?? readAt })));
      setUnreadCount(0);
    }
  }

  function destination(item: Notification) {
    if (item.type === "article_published" && item.articleSlug) return `/artikel/${item.articleSlug}`;
    return item.articleId ? `/dashboard/articles/${item.articleId}/edit` : "/dashboard";
  }

  return <section className="notification-center" id="notifications" aria-labelledby="notifications-heading">
    <div className="notification-heading">
      <div><p className="kicker">INBOX REDAKSI</p><h2 id="notifications-heading">Notifikasi</h2></div>
      <div className="notification-tools">
        <span className="notification-count" role="status" aria-atomic="true">{unreadCount} notifikasi belum dibaca</span>
        {unreadCount > 0 && <button className="text-button" onClick={markAllRead}>Tandai semua dibaca</button>}
      </div>
    </div>
    {loading ? <p className="empty-state" aria-busy="true">Memuat notifikasi…</p> : error ? <p className="notification-error" role="alert">{error} <button className="text-button" onClick={load}>Coba lagi</button></p> : items.length === 0 ? <p className="empty-state">Belum ada notifikasi editorial.</p> : <ul className="notification-list">
      {items.map((item) => <li key={item.id} className={item.readAt ? "notification-item" : "notification-item notification-unread"}>
        <Link href={destination(item)} onClick={() => void markRead(item.id)}>
          <div className="notification-meta">{!item.readAt && <span className="new-label">Baru</span>}<time dateTime={item.createdAt}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time></div>
          <strong>{item.title}</strong><p>{item.message}</p>
        </Link>
        {!item.readAt && <button className="text-button" onClick={() => void markRead(item.id)}>Tandai dibaca</button>}
      </li>)}
    </ul>}
  </section>;
}
