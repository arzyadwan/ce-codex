import fs from "node:fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const schema = fs.readFileSync("../../database/editorial-schema.sql", "utf8");
  const rls = fs.readFileSync("../../database/rls-baseline.sql", "utf8");
  const authProfileSync = fs.readFileSync("../../database/auth-profile-sync.sql", "utf8");
  const scheduledPublishing = fs.readFileSync("../../database/scheduled-publishing.sql", "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(schema);
    await tx.unsafe(rls);
    await tx.unsafe(authProfileSync);
    await tx.unsafe(scheduledPublishing);
  });
  const expectedTables = ['profiles', 'categories', 'articles', 'tags', 'article_tags', 'article_approvals', 'article_revisions', 'audit_logs', 'notifications', 'newsletter_subscribers'];
  const [tables] = await sql`select count(*)::int as count from information_schema.tables where table_schema = 'public' and table_name = any(${expectedTables})`;
  const [secured] = await sql`select count(*)::int as count from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any(${expectedTables}) and c.relrowsecurity`;
  const [policies] = await sql`select count(*)::int as count from pg_policies where schemaname = 'public' and tablename = any(${['articles', 'categories', 'tags', 'article_tags']})`;
  const [cronJob] = await sql`select jobid, schedule, command, active from cron.job where jobname = 'crypto-exist-publish-due' and active`;
  const [functionPrivileges] = await sql`
    select
      has_function_privilege('anon', 'private.publish_due_articles()', 'EXECUTE') as anon_execute,
      has_function_privilege('authenticated', 'private.publish_due_articles()', 'EXECUTE') as authenticated_execute
  `;
  const [latestCronRun] = cronJob
    ? await sql`
        select status
        from cron.job_run_details
        where jobid = ${cronJob.jobid}
        order by start_time desc
        limit 1
      `
    : [undefined];
  console.log(`SCHEMA_TABLES=${tables.count}/${expectedTables.length}`);
  console.log(`RLS_ENABLED=${secured.count}/${expectedTables.length}`);
  console.log(`PUBLIC_READ_POLICIES=${policies.count}`);
  console.log(`PUBLISH_CRON_ACTIVE=${cronJob ? 1 : 0}/1`);
  console.log(`PUBLISH_CRON_SCHEDULE=${cronJob?.schedule ?? 'missing'}`);
  console.log(`PUBLISH_FUNCTION_CLIENT_EXECUTE=${functionPrivileges.anon_execute || functionPrivileges.authenticated_execute}`);
  console.log(`PUBLISH_CRON_LAST_RUN=${latestCronRun?.status ?? 'pending'}`);
} catch (error) {
  console.error(`SCHEMA_APPLY=FAILED:${error.code ?? error.name}:${error.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
