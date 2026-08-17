import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const [users] = await sql`select count(*)::int as count from auth.users`;
  const [profiles] = await sql`select count(*)::int as count from public.profiles`;
  const [missing] = await sql`select count(*)::int as count from auth.users u left join public.profiles p on p.id = u.id where p.id is null`;
  const [admins] = await sql`select count(*)::int as count from public.profiles where role = 'admin'`;
  console.log(`AUTH_USERS=${users.count}`);
  console.log(`PROFILES=${profiles.count}`);
  console.log(`MISSING_PROFILES=${missing.count}`);
  console.log(`ADMINS=${admins.count}`);
} finally { await sql.end(); }
