import postgres from "postgres";

const api = "http://127.0.0.1:4000/v1";
const supabase = process.env.SUPABASE_URL.replace(/\/$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const slug = `codex-e2e-${Date.now()}`;
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
let articleId;

async function login(email, password) {
  const response = await fetch(`${supabase}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`Login smoke test gagal (${response.status}).`);
  return (await response.json()).access_token;
}
async function request(path, token, init = {}) {
  const response = await fetch(`${api}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers } });
  if (!response.ok) throw new Error(`${path} gagal (${response.status}): ${await response.text()}`);
  return response.json();
}

try {
  const authorToken = await login(process.env.SMOKE_AUTHOR_EMAIL, process.env.SMOKE_AUTHOR_PASSWORD);
  const adminToken = await login(process.env.SMOKE_ADMIN_EMAIL, process.env.SMOKE_ADMIN_PASSWORD);
  console.log("E2E_LOGIN_BOTH=SUCCESS");
  const article = await request("/articles", authorToken, { method: "POST", body: JSON.stringify({ title: "Pengujian Integrasi Editorial Crypto Exist", slug, excerpt: "Artikel sementara untuk memverifikasi seluruh workflow editorial aplikasi.", content: { type: "doc", content: [{ type: "paragraph", text: "Konten pengujian integrasi." }] } }) });
  articleId = article.id;
  console.log("E2E_DRAFT=SUCCESS");
  const editorialDraft = await request(`/articles/editorial/${articleId}`, authorToken);
  if (editorialDraft.id !== articleId) throw new Error("Draft editorial tidak dapat dibaca oleh penulis.");
  const updated = await request(`/articles/${articleId}`, authorToken, { method: "PATCH", body: JSON.stringify({ seoTitle: "SEO Crypto Exist E2E", seoDescription: "Deskripsi SEO sementara untuk memverifikasi alur penyuntingan artikel Crypto Exist.", content: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Pembaruan terstruktur" }] }, { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Konten hasil edit." }] }] } }) });
  if (updated.seoTitle !== "SEO Crypto Exist E2E") throw new Error("Metadata SEO tidak tersimpan.");
  console.log("E2E_EDIT_AND_SEO=SUCCESS");
  const mine = await request("/articles/mine", authorToken);
  if (!mine.some((item) => item.id === articleId)) throw new Error("Draft tidak muncul pada daftar artikel author.");
  console.log("E2E_AUTHOR_LIST=SUCCESS");
  await request(`/articles/${articleId}/submit`, authorToken, { method: "POST", body: "{}" });
  console.log("E2E_SUBMIT=SUCCESS");
  const adminNotifications = await request("/notifications", adminToken);
  const reviewNotification = adminNotifications.items.find((item) => item.articleId === articleId && item.type === "review_requested");
  if (!reviewNotification || reviewNotification.readAt) throw new Error("Admin tidak menerima notifikasi review yang belum dibaca.");
  await request(`/notifications/${reviewNotification.id}/read`, adminToken, { method: "PATCH", body: "{}" });
  const adminNotificationsRead = await request("/notifications", adminToken);
  if (!adminNotificationsRead.items.find((item) => item.id === reviewNotification.id)?.readAt) throw new Error("Notifikasi review tidak dapat ditandai dibaca.");
  console.log("E2E_REVIEW_NOTIFICATION=SUCCESS");
  const queue = await request("/articles/review-queue", adminToken);
  if (!queue.some((item) => item.id === articleId)) throw new Error("Artikel tidak muncul pada antrean review admin.");
  console.log("E2E_REVIEW_QUEUE=SUCCESS");
  const revision = await request(`/articles/${articleId}/request-changes`, adminToken, { method: "POST", body: JSON.stringify({ note: "Tambahkan konteks sumber dan perjelas kesimpulan analisis." }) });
  if (revision.article.status !== "changes_requested") throw new Error("Status permintaan revisi tidak tepat.");
  console.log("E2E_REQUEST_CHANGES=SUCCESS");
  const authorRevisionNotifications = await request("/notifications", authorToken);
  if (!authorRevisionNotifications.items.some((item) => item.articleId === articleId && item.type === "changes_requested" && !item.readAt)) throw new Error("Penulis tidak menerima notifikasi revisi.");
  if (authorRevisionNotifications.items.some((item) => item.articleId === articleId && item.type === "review_requested")) throw new Error("Notifikasi reviewer bocor ke penulis.");
  await request("/notifications/read-all", authorToken, { method: "PATCH", body: "{}" });
  console.log("E2E_REVISION_NOTIFICATION=SUCCESS");
  const revisionDraft = await request(`/articles/editorial/${articleId}`, authorToken);
  if (!revisionDraft.canEdit || revisionDraft.revisionNotes.length !== 1) throw new Error("Penulis tidak menerima akses edit atau catatan revisi.");
  await request(`/articles/${articleId}`, authorToken, { method: "PATCH", body: JSON.stringify({ excerpt: "Artikel sementara yang telah diperbaiki berdasarkan catatan editor untuk verifikasi workflow." }) });
  await request(`/articles/${articleId}/submit`, authorToken, { method: "POST", body: "{}" });
  console.log("E2E_REVISE_AND_RESUBMIT=SUCCESS");
  const scheduled = await request(`/articles/${articleId}/schedule`, adminToken, { method: "POST", body: JSON.stringify({ publishAt: new Date(Date.now() + 120_000).toISOString() }) });
  if (scheduled.article.status !== "scheduled") throw new Error("Status hasil penjadwalan bukan scheduled.");
  console.log("E2E_APPROVE_SCHEDULE=SUCCESS");
  const authorScheduledNotifications = await request("/notifications", authorToken);
  if (!authorScheduledNotifications.items.some((item) => item.articleId === articleId && item.type === "article_scheduled")) throw new Error("Penulis tidak menerima notifikasi penjadwalan.");
  console.log("E2E_SCHEDULE_NOTIFICATION=SUCCESS");
  await sql`update public.articles set published_at = now() - interval '1 minute' where id = ${articleId}`;
  const dueResponse = await fetch(`${api}/articles?q=${encodeURIComponent("Pengujian Integrasi Editorial")}`);
  if (!dueResponse.ok) throw new Error(`Pemrosesan jadwal gagal (${dueResponse.status}).`);
  const duePayload = await dueResponse.json();
  if (!duePayload.items.some((item) => item.id === articleId && item.status === "published")) throw new Error("Artikel terjadwal tidak diterbitkan saat jatuh tempo.");
  console.log("E2E_SCHEDULED_PUBLISH=SUCCESS");
  const authorPublishedNotifications = await request("/notifications", authorToken);
  if (!authorPublishedNotifications.items.some((item) => item.articleId === articleId && item.type === "article_published")) throw new Error("Penulis tidak menerima notifikasi publikasi.");
  console.log("E2E_PUBLISH_NOTIFICATION=SUCCESS");
  const publicArticle = await fetch(`${api}/articles/${slug}`);
  if (!publicArticle.ok) throw new Error(`Artikel publik gagal dibaca (${publicArticle.status}).`);
  const [approval] = await sql`select count(*)::int as count from public.article_approvals where article_id = ${articleId}`;
  if (approval.count !== 1) throw new Error(`Jumlah approval tidak tepat: ${approval.count}`);
  console.log("E2E_PUBLIC_READ=SUCCESS");
  console.log("E2E_SINGLE_APPROVAL=SUCCESS");
} finally {
  if (articleId) {
    await sql.begin(async (tx) => {
      await tx`delete from public.audit_logs where target_type = 'article' and target_id = ${articleId}`;
      await tx`delete from public.articles where id = ${articleId}`;
    });
    console.log("E2E_FIXTURE_CLEANUP=SUCCESS");
  }
  await sql.end();
}
