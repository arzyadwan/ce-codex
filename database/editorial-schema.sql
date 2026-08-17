-- Baseline untuk diterapkan melalui Supabase SQL Editor/CLI setelah kredensial proyek tersedia.
create extension if not exists pgcrypto;

do $$ begin
  create type public.editorial_role as enum ('author', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.article_status as enum ('draft', 'in_review', 'scheduled', 'published', 'archived');
exception when duplicate_object then null; end $$;

alter type public.article_status add value if not exists 'changes_requested' before 'in_review';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text not null unique,
  role public.editorial_role not null default 'author',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, created_at timestamptz not null default now()
);

insert into public.categories (name, slug, description) values
  ('Berita Pasar', 'berita-pasar', 'Pembaruan pasar dan breaking news aset digital.'),
  ('Analisis', 'analisis', 'Analisis harga, industri, dan regulasi.'),
  ('Edukasi', 'edukasi', 'Panduan crypto, keamanan, dan blockchain.'),
  ('Web3 & DeFi', 'web3-defi', 'Perkembangan Web3, NFT, smart contract, dan DeFi.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  featured_image_url text,
  seo_title text,
  seo_description text,
  category_id uuid references public.categories(id),
  content jsonb not null,
  status public.article_status not null default 'draft',
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  content_type text not null default 'news' check (content_type in ('news', 'analysis', 'opinion', 'education', 'press_release', 'sponsored')),
  sources jsonb not null default '[]'::jsonb,
  sponsor_name text,
  sponsor_url text,
  sponsor_disclosure text,
  affiliate_disclosure text,
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles add column if not exists featured_image_url text;
alter table public.articles add column if not exists seo_title text;
alter table public.articles add column if not exists seo_description text;
alter table public.articles add column if not exists category_id uuid references public.categories(id);
alter table public.articles add column if not exists is_breaking boolean not null default false;
alter table public.articles add column if not exists content_type text not null default 'news';
alter table public.articles add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.articles add column if not exists sponsor_name text;
alter table public.articles add column if not exists sponsor_url text;
alter table public.articles add column if not exists sponsor_disclosure text;
alter table public.articles add column if not exists affiliate_disclosure text;

do $$ begin
  alter table public.articles add constraint articles_content_type_check
  check (content_type in ('news', 'analysis', 'opinion', 'education', 'press_release', 'sponsored'));
exception when duplicate_object then null; end $$;

create index if not exists articles_status_published_at_idx on public.articles(status, published_at desc);
create index if not exists articles_author_id_idx on public.articles(author_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create index if not exists article_tags_tag_id_idx on public.article_tags(tag_id);

create table if not exists public.article_approvals (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles(id) on delete cascade,
  approved_by uuid not null references public.profiles(id),
  approved_at timestamptz not null default now()
);

create table if not exists public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  note text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists article_revisions_article_id_idx on public.article_revisions(article_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_target_idx on public.audit_logs(target_type, target_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  article_id uuid references public.articles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_recipient_dedupe_key unique (recipient_id, dedupe_key)
);

create index if not exists notifications_recipient_read_created_idx
on public.notifications(recipient_id, read_at, created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, advertiser text not null,
  placement text not null check (placement in ('homepage_leaderboard','homepage_inline','article_inline','article_sidebar')),
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  creative_url text not null, creative_alt text not null, destination_url text not null,
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  impression_count integer not null default 0 check (impression_count >= 0),
  click_count integer not null default 0 check (click_count >= 0),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ad_campaigns_active_placement_idx on public.ad_campaigns(status, placement, starts_at, ends_at);

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  type text not null check (type in ('impression','click')), session_hash text, occurred_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_type_occurred_idx on public.ad_events(campaign_id, type, occurred_at);
