import postgres from "postgres";

const email = process.env.BOOTSTRAP_USER_EMAIL;
const password = process.env.BOOTSTRAP_USER_PASSWORD;
const role = process.env.BOOTSTRAP_USER_ROLE ?? "author";
if (!email || !password || !["author", "editor"].includes(role)) throw new Error("Email, password, atau role provisioning tidak valid.");
const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Konfigurasi admin Supabase belum tersedia.");

const response = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: "Anggota Redaksi Crypto Exist" } }),
});
let userId;
if (response.ok) userId = (await response.json()).id;
else {
  const body = await response.json().catch(() => ({}));
  if (!String(body.message ?? body.msg ?? "").toLowerCase().includes("already")) throw new Error(`Supabase Admin API gagal (${response.status}).`);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  if (!userId) userId = (await sql`select id from auth.users where lower(email) = lower(${email}) limit 1`)[0]?.id;
  if (!userId) throw new Error("User editorial tidak ditemukan setelah provisioning.");
  await sql`
    insert into public.profiles (id, display_name, username, role)
    values (${userId}, 'Anggota Redaksi Crypto Exist', ${`author-${String(userId).slice(0, 8)}`}, ${role})
    on conflict (id) do update set role = excluded.role, updated_at = now()
  `;
  console.log(`EDITORIAL_USER_BOOTSTRAP=SUCCESS`);
  console.log(`EDITORIAL_USER_ROLE=${role}`);
} finally { await sql.end(); }
