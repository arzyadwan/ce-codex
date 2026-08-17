create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;

create or replace function private.publish_due_articles()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_count integer;
begin
  with due as (
    update public.articles
    set status = 'published', updated_at = now()
    where status = 'scheduled' and published_at <= now()
    returning id, author_id, title
  ), notified as (
    insert into public.notifications (
      recipient_id, article_id, type, title, message, dedupe_key
    )
    select
      author_id,
      id,
      'article_published',
      'Artikel telah terbit',
      '“' || title || '” telah dipublikasikan sesuai jadwal.',
      'article:' || id::text || ':scheduled-published'
    from due
    on conflict (recipient_id, dedupe_key) do nothing
    returning 1
  ), logged as (
    insert into public.audit_logs (action, target_type, target_id, metadata)
    select 'article.scheduled_published', 'article', id, '{}'::jsonb
    from due
    returning 1
  )
  select count(*)::integer into published_count from logged;

  return published_count;
end;
$$;

revoke all on function private.publish_due_articles() from public, anon, authenticated;

select cron.schedule(
  'crypto-exist-publish-due',
  '* * * * *',
  'select private.publish_due_articles()'
);
