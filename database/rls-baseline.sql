alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.article_approvals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_revisions enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_events enable row level security;

-- Data API exposure is explicit. Editorial mutations only pass through NestJS.
revoke all on table public.profiles, public.article_approvals, public.audit_logs from anon, authenticated;
revoke all on table public.article_revisions from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.newsletter_subscribers from anon, authenticated;
revoke all on table public.ad_campaigns, public.ad_events from anon, authenticated;
revoke insert, update, delete on table public.articles from anon, authenticated;
grant select on table public.articles to anon, authenticated;
grant select on table public.categories, public.tags, public.article_tags to anon, authenticated;

drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable" on public.categories for select to anon, authenticated using (true);
drop policy if exists "tags are publicly readable" on public.tags;
create policy "tags are publicly readable" on public.tags for select to anon, authenticated using (true);
drop policy if exists "published article tags are publicly readable" on public.article_tags;
create policy "published article tags are publicly readable" on public.article_tags for select to anon, authenticated
using (exists (select 1 from public.articles where articles.id = article_tags.article_id and articles.status = 'published' and articles.published_at is not null));

drop policy if exists "published articles are publicly readable" on public.articles;
create policy "published articles are publicly readable"
on public.articles for select
to anon, authenticated
using (status = 'published' and published_at is not null);

-- Tidak ada policy mutasi untuk client. Mutasi editorial melewati Application Tier.
-- audit_logs dan article_approvals sengaja tidak memiliki client policy.
-- notifications juga tidak memiliki client policy; pemilik mengaksesnya melalui Application Tier.
-- newsletter_subscribers juga server-only; pendaftaran dan unsubscribe melewati Application Tier.
-- Campaign dan event iklan hanya diakses melalui Application Tier; tidak ada policy client.
