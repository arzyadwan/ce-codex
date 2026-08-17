import postgres from "postgres";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const [stdinEmail, stdinPassword] = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? stdinEmail;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? stdinPassword;
if (!email || !password) throw new Error("Email dan password wajib diberikan melalui stdin.");

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("SUPABASE_URL atau service role key belum tersedia.");

const response = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: "Administrator Crypto Exist" } }),
});

let userId;
if (response.ok) {
  userId = (await response.json()).id;
} else {
  const body = await response.json().catch(() => ({}));
  if (!String(body.message ?? body.msg ?? "").toLowerCase().includes("already")) throw new Error(`Supabase Admin API gagal (${response.status}).`);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  if (!userId) {
    const [existing] = await sql`select id from auth.users where lower(email) = lower(${email}) limit 1`;
    userId = existing?.id;
  }
  if (!userId) throw new Error("User admin tidak ditemukan setelah provisioning.");
  await sql`
    insert into public.profiles (id, display_name, username, role)
    values (${userId}, 'Administrator Crypto Exist', ${`admin-${String(userId).slice(0, 8)}`}, 'admin')
    on conflict (id) do update set role = 'admin', updated_at = now()
  `;
  console.log("ADMIN_BOOTSTRAP=SUCCESS");
} finally {
  await sql.end();
}
