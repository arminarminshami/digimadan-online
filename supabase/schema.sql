-- ============================================================
-- DigiMadan.com — Supabase database schema
-- Run this entire file in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extension needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Table: ads
-- ------------------------------------------------------------
create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('mine_sale', 'mineral_sale', 'partnership', 'service')),
  province text not null,
  mineral_type text,
  description text not null default '',
  images text[] not null default '{}',
  contact_name text,
  phone text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_status_idx on ads (status);
create index if not exists ads_category_idx on ads (category);
create index if not exists ads_province_idx on ads (province);
create index if not exists ads_created_at_idx on ads (created_at desc);

-- ------------------------------------------------------------
-- Table: pages  (About / Contact / News / any future static page)
-- ------------------------------------------------------------
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: banners  (homepage banner images)
-- ------------------------------------------------------------
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  image_path text,
  link_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: admin_users  (profile/role info linked to Supabase Auth users)
-- ------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table ads enable row level security;
alter table pages enable row level security;
alter table banners enable row level security;
alter table admin_users enable row level security;

-- Public (anon) read access: only published ads
drop policy if exists "Public can read published ads" on ads;
create policy "Public can read published ads"
  on ads for select
  to anon
  using (status = 'published');

-- Public (anon) read access: all pages and active banners
drop policy if exists "Public can read pages" on pages;
create policy "Public can read pages"
  on pages for select
  to anon
  using (true);

drop policy if exists "Public can read active banners" on banners;
create policy "Public can read active banners"
  on banners for select
  to anon
  using (is_active = true);

-- Authenticated (logged-in admin) full access to everything.
-- This MVP treats any authenticated Supabase Auth user as an admin,
-- since only the owner account is created. Restrict further once
-- multiple roles are introduced (see admin_users.role).

drop policy if exists "Authenticated full access ads" on ads;
create policy "Authenticated full access ads"
  on ads for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated full access pages" on pages;
create policy "Authenticated full access pages"
  on pages for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated full access banners" on banners;
create policy "Authenticated full access banners"
  on banners for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated read own admin profile" on admin_users;
create policy "Authenticated read own admin profile"
  on admin_users for select
  to authenticated
  using (true);

-- ============================================================
-- Seed: starter content pages so the public site isn't empty
-- ============================================================

insert into pages (slug, title, content)
values
  ('about', 'درباره ما',
   'دیجی‌معدن بستری برای انتشار آگهی‌های فروش معدن، مواد معدنی، درخواست مشارکت و خدمات معدن‌کاری در سراسر ایران است. هدف ما ساده‌سازی ارتباط میان معدن‌داران، خریداران و فعالان این صنعت است.'),
  ('news', 'اخبار',
   'به‌زودی اخبار و تحلیل‌های صنعت معدن ایران در این بخش منتشر می‌شود.')
on conflict (slug) do nothing;

-- ============================================================
-- Done. Next steps:
-- 1. Go to Authentication > Users and create your owner account (email + password).
-- 2. Go to Storage and create two PUBLIC buckets: "ad-images" and "banner-images".
--    (Storage bucket creation is not done via SQL — see setup instructions.)
-- ============================================================
