-- ============================================================
-- DigiMadan.com — Platform Expansion Migration
-- این فایل فقط اضافه می‌کند، هیچ جدول یا داده‌ی فعلی را حذف نمی‌کند.
-- Safe additive migration: existing tables (ads, pages, banners, admin_users)
-- and their data are left fully intact.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1) ads: ستون‌های جدید برای سیستم حراج
-- ============================================================

alter table ads add column if not exists base_price numeric;
alter table ads add column if not exists current_price numeric;
alter table ads add column if not exists auction_starts_at timestamptz;
alter table ads add column if not exists auction_ends_at timestamptz;
alter table ads add column if not exists purity_percent numeric;
alter table ads add column if not exists ore_grade text;
alter table ads add column if not exists humidity_percent numeric;
alter table ads add column if not exists granularity text;
alter table ads add column if not exists mineral_form text
  check (mineral_form is null or mineral_form in ('lump','rock','powder','soil','granulated','other'));
alter table ads add column if not exists views_count integer not null default 0;
alter table ads add column if not exists favorites_count integer not null default 0;
alter table ads add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
alter table ads add column if not exists winner_user_id uuid references auth.users (id) on delete set null;
alter table ads add column if not exists is_archived boolean not null default false;

-- وضعیت‌های جدید حراج اضافه می‌شود بدون اینکه مقادیر قبلی (draft/published) را بشکند.
alter table ads drop constraint if exists ads_status_check;
alter table ads add constraint ads_status_check check (
  status in ('draft','published','pending','approved','live','sold','archived')
);

-- دسته‌بندی‌های ۵ گانه‌ی نهایی پروژه را هم به لیست مجاز اضافه می‌کنیم
-- (دسته‌های قدیمی هم برای سازگاری با آگهی فعلی نگه داشته می‌شوند)
alter table ads drop constraint if exists ads_category_check;
alter table ads add constraint ads_category_check check (
  category in (
    'mine_sale','mineral_sale','partnership','service', -- قدیمی، حفظ‌شده برای سازگاری
    'mineral_materials','mines','partnership_investment',
    'exploration_operations','extraction_operations'     -- ۵ دسته‌ی نهایی
  )
);

create index if not exists ads_auction_ends_at_idx on ads (auction_ends_at);
create index if not exists ads_owner_user_id_idx on ads (owner_user_id);

-- ------------------------------------------------------------
-- bids: پیشنهادهای حراج
-- ------------------------------------------------------------
create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references ads (id) on delete cascade,
  bidder_user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists bids_ad_id_idx on bids (ad_id);
create index if not exists bids_bidder_user_id_idx on bids (bidder_user_id);

-- ============================================================
-- 2) پروفایل کاربران سایت (غیر از ادمین)
-- ============================================================
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  national_id text,
  phone text,
  company_name text,
  company_national_id text,
  province text,
  city text,
  specialty text check (specialty is null or specialty in
    ('mine_owner','investor','exploration_specialist','extraction_specialist','mineral_trader','other')),
  description text,
  id_card_file_url text,
  license_file_urls text[] not null default '{}',
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_profiles_auth_user_id_idx on user_profiles (auth_user_id);

-- ============================================================
-- 3) کیف پول و امتیاز
-- ============================================================
create table if not exists wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  points_balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in
    ('ad_registration','successful_transaction','identity_verification','referral','manual_adjustment')),
  related_ad_id uuid references ads (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_transactions_auth_user_id_idx on wallet_transactions (auth_user_id);

-- ============================================================
-- 4) چت خریدار/فروشنده
-- ============================================================
create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references ads (id) on delete cascade,
  buyer_user_id uuid not null references auth.users (id) on delete cascade,
  seller_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ad_id, buyer_user_id, seller_user_id)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  content text,
  file_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_id_idx on chat_messages (thread_id);

-- ============================================================
-- 5) اعلان‌های درون‌سایتی
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in
    ('new_bid','auction_ending','new_message','ad_approved','ad_rejected','wallet_reward','system')),
  title text not null,
  body text,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_auth_user_id_idx on notifications (auth_user_id);

-- ============================================================
-- 6) مقالات و اخبار
-- ============================================================
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  cover_image_url text,
  author_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending','published','rejected')),
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_idx on articles (status);

create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  source_url text,
  summary text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7) علاقه‌مندی‌ها و گزارش تخلف
-- ============================================================
create table if not exists user_favorites (
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  ad_id uuid not null references ads (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (auth_user_id, ad_id)
);

create table if not exists content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('ad','article','chat_message','user')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8) سیستم پیامک (OTP + اعلان پیامکی) — معماری ماژولار
-- ============================================================
create table if not exists sms_config (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null default '' , -- مثلا kavenegar, melipayamak و غیره — بعدا از پنل ادمین وارد می‌شود
  api_key text default '',                  -- کلید واقعی بعدا از پنل ادمین وارد می‌شود
  sender_number text default '',
  otp_template_name text default '',
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into sms_config (provider_name, is_enabled)
  select '', false
  where not exists (select 1 from sms_config);

create table if not exists sms_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists sms_otp_codes_phone_idx on sms_otp_codes (phone);

create table if not exists sms_log (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  message_type text not null check (message_type in ('otp','auction_reminder','approval','rejection','custom')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  provider_response text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9) سیستم قیمت — معماری ماژولار، آماده برای اتصال API واقعی
-- ============================================================
create table if not exists price_items (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,         -- مثلا 'gold_ounce', 'usd_irr', 'coin_emami'
  label_fa text not null,
  category text not null check (category in ('global','iranian')),
  unit text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists price_values (
  price_item_id uuid primary key references price_items (id) on delete cascade,
  current_value numeric,
  previous_value numeric,
  change_percent numeric,
  day_low numeric,
  day_high numeric,
  updated_at timestamptz not null default now()
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  price_item_id uuid not null references price_items (id) on delete cascade,
  value numeric not null,
  recorded_at timestamptz not null default now()
);
create index if not exists price_history_item_idx on price_history (price_item_id, recorded_at desc);

create table if not exists price_provider_config (
  id uuid primary key default gen_random_uuid(),
  provider_name text default '',     -- مثلا metals-api, metalpriceapi — بعدا از پنل ادمین
  api_key text default '',           -- کلید واقعی بعدا وارد می‌شود
  refresh_interval_minutes integer not null default 5,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into price_provider_config (provider_name, is_enabled)
  select '', false
  where not exists (select 1 from price_provider_config);

create table if not exists user_price_alerts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  price_item_id uuid not null references price_items (id) on delete cascade,
  target_value numeric not null,
  direction text not null check (direction in ('above','below')),
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_price_favorites (
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  price_item_id uuid not null references price_items (id) on delete cascade,
  primary key (auth_user_id, price_item_id)
);

-- ============================================================
-- 10) معماری هوش مصنوعی — فقط ساختار، بدون اتصال واقعی هنوز
-- ============================================================
create table if not exists ai_config (
  id uuid primary key default gen_random_uuid(),
  provider_name text default '',   -- بعدا تکمیل می‌شود
  api_key text default '',         -- placeholder — کلید واقعی بعدا وارد می‌شود
  model_name text default '',
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into ai_config (provider_name, is_enabled)
  select '', false
  where not exists (select 1 from ai_config);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations (id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_conversation_idx on ai_messages (conversation_id);

-- ============================================================
-- 11) لاگ فعالیت ادمین (امنیت/حسابرسی)
-- ============================================================
create table if not exists admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_auth_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security روی همه‌ی جدول‌های جدید
-- ============================================================

alter table bids enable row level security;
alter table user_profiles enable row level security;
alter table wallet_accounts enable row level security;
alter table wallet_transactions enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;
alter table articles enable row level security;
alter table news_items enable row level security;
alter table user_favorites enable row level security;
alter table content_reports enable row level security;
alter table sms_config enable row level security;
alter table sms_otp_codes enable row level security;
alter table sms_log enable row level security;
alter table price_items enable row level security;
alter table price_values enable row level security;
alter table price_history enable row level security;
alter table price_provider_config enable row level security;
alter table user_price_alerts enable row level security;
alter table user_price_favorites enable row level security;
alter table ai_config enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table admin_activity_log enable row level security;

-- --- دسترسی عمومی (anon): فقط خواندن چیزهای عمومی ---

drop policy if exists "Public can read active price items" on price_items;
create policy "Public can read active price items" on price_items for select to anon using (is_active = true);

drop policy if exists "Public can read price values" on price_values;
create policy "Public can read price values" on price_values for select to anon using (true);

drop policy if exists "Public can read price history" on price_history;
create policy "Public can read price history" on price_history for select to anon using (true);

drop policy if exists "Public can read published articles" on articles;
create policy "Public can read published articles" on articles for select to anon using (status = 'published');

drop policy if exists "Public can read news" on news_items;
create policy "Public can read news" on news_items for select to anon using (true);

drop policy if exists "Public can read bids" on bids;
create policy "Public can read bids" on bids for select to anon using (true);

-- --- دسترسی کاربر لاگین‌شده به داده‌های خودش ---

drop policy if exists "Users manage own profile" on user_profiles;
create policy "Users manage own profile" on user_profiles for all to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "Users read own wallet" on wallet_accounts;
create policy "Users read own wallet" on wallet_accounts for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Users read own wallet transactions" on wallet_transactions;
create policy "Users read own wallet transactions" on wallet_transactions for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Users create bids" on bids;
create policy "Users create bids" on bids for insert to authenticated
  with check (bidder_user_id = auth.uid());

drop policy if exists "Users access own chat threads" on chat_threads;
create policy "Users access own chat threads" on chat_threads for all to authenticated
  using (buyer_user_id = auth.uid() or seller_user_id = auth.uid())
  with check (buyer_user_id = auth.uid() or seller_user_id = auth.uid());

drop policy if exists "Users access own chat messages" on chat_messages;
create policy "Users access own chat messages" on chat_messages for all to authenticated
  using (
    exists (
      select 1 from chat_threads t
      where t.id = chat_messages.thread_id
        and (t.buyer_user_id = auth.uid() or t.seller_user_id = auth.uid())
    )
  )
  with check (sender_user_id = auth.uid());

drop policy if exists "Users read own notifications" on notifications;
create policy "Users read own notifications" on notifications for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications" on notifications for update to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Users manage own favorites" on user_favorites;
create policy "Users manage own favorites" on user_favorites for all to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "Users manage own price alerts" on user_price_alerts;
create policy "Users manage own price alerts" on user_price_alerts for all to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "Users manage own price favorites" on user_price_favorites;
create policy "Users manage own price favorites" on user_price_favorites for all to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "Users create reports" on content_reports;
create policy "Users create reports" on content_reports for insert to authenticated
  with check (reporter_user_id = auth.uid());

drop policy if exists "Users manage own ai conversations" on ai_conversations;
create policy "Users manage own ai conversations" on ai_conversations for all to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "Users manage own ai messages" on ai_messages;
create policy "Users manage own ai messages" on ai_messages for all to authenticated
  using (
    exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and c.auth_user_id = auth.uid())
  );

drop policy if exists "Users submit articles" on articles;
create policy "Users submit articles" on articles for insert to authenticated
  with check (author_user_id = auth.uid());

-- --- دسترسی کامل ادمین (هر کاربر authenticated در این MVP = ادمین، طبق منطق فعلی پروژه) ---

drop policy if exists "Admin full access bids" on bids;
create policy "Admin full access bids" on bids for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access wallet_transactions" on wallet_transactions;
create policy "Admin full access wallet_transactions" on wallet_transactions for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access articles" on articles;
create policy "Admin full access articles" on articles for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access news_items" on news_items;
create policy "Admin full access news_items" on news_items for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access content_reports" on content_reports;
create policy "Admin full access content_reports" on content_reports for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access sms_config" on sms_config;
create policy "Admin full access sms_config" on sms_config for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access sms_log" on sms_log;
create policy "Admin full access sms_log" on sms_log for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access price_items" on price_items;
create policy "Admin full access price_items" on price_items for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access price_values" on price_values;
create policy "Admin full access price_values" on price_values for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access price_history" on price_history;
create policy "Admin full access price_history" on price_history for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access price_provider_config" on price_provider_config;
create policy "Admin full access price_provider_config" on price_provider_config for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access ai_config" on ai_config;
create policy "Admin full access ai_config" on ai_config for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access admin_activity_log" on admin_activity_log;
create policy "Admin full access admin_activity_log" on admin_activity_log for all to authenticated using (true) with check (true);

drop policy if exists "Admin full access wallet_accounts" on wallet_accounts;
create policy "Admin full access wallet_accounts" on wallet_accounts for all to authenticated using (true) with check (true);

-- sms_otp_codes: کاربر public نباید بتواند مستقیم بخواند (امنیتی)؛
-- این جدول فقط از طریق Edge Function (با service role) خوانده/نوشته می‌شود.
-- پس به‌عمد هیچ policy ای برای anon/authenticated تعریف نمی‌شود (یعنی پیش‌فرض: دسترسی نیست).

-- ============================================================
-- داده‌ی اولیه: ردیف‌های قیمت پایه (مقدارشان بعدا با API واقعی پر می‌شود)
-- ============================================================
insert into price_items (key, label_fa, category, unit, sort_order) values
  ('gold_ounce', 'انس طلا', 'global', 'دلار', 1),
  ('silver_ounce', 'انس نقره', 'global', 'دلار', 2),
  ('platinum_ounce', 'انس پلاتین', 'global', 'دلار', 3),
  ('oil_brent', 'نفت برنت', 'global', 'دلار', 4),
  ('usd_global', 'دلار (جهانی)', 'global', 'دلار', 5),
  ('copper', 'مس', 'global', 'دلار', 6),
  ('iron_ore', 'سنگ‌آهن', 'global', 'دلار', 7),
  ('gold_18k_irr', 'طلای ۱۸ عیار', 'iranian', 'ریال', 10),
  ('coin_emami', 'سکه امامی', 'iranian', 'ریال', 11),
  ('usd_irr_free', 'دلار آزاد', 'iranian', 'ریال', 12),
  ('eur_irr_free', 'یورو آزاد', 'iranian', 'ریال', 13)
on conflict (key) do nothing;

insert into price_values (price_item_id)
  select id from price_items
  on conflict (price_item_id) do nothing;

-- ============================================================
-- پایان migration. هیچ جدول یا داده‌ی قبلی حذف یا تغییر اساسی نکرد.
-- ============================================================
