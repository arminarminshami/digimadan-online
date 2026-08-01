-- ============================================================
-- Migration 002 — بازطراحی پنل کاربری + نردبان کردن آگهی
-- این فایل را در Supabase Dashboard > SQL Editor > New query اجرا کنید
-- (بعد از migration_001_platform_expansion.sql)
-- ============================================================

-- ------------------------------------------------------------
-- 1) نردبان کردن آگهی: هر کاربر می‌تواند آگهی خودش را نردبان کند
-- تا در ابتدای لیست‌ها نمایش داده شود.
-- ------------------------------------------------------------
alter table ads add column if not exists boosted_at timestamptz;
create index if not exists ads_boosted_at_idx on ads (boosted_at desc nulls last);

-- ------------------------------------------------------------
-- 2) تکمیل پروفایل کاربر: اطلاعات هویتی، تماس، آدرس و شغلی
-- ------------------------------------------------------------
alter table user_profiles add column if not exists first_name text;
alter table user_profiles add column if not exists last_name text;
alter table user_profiles add column if not exists birth_date date;
alter table user_profiles add column if not exists avatar_url text;
alter table user_profiles add column if not exists email text;
alter table user_profiles add column if not exists landline_phone text;
alter table user_profiles add column if not exists address text;
alter table user_profiles add column if not exists postal_code text;

-- سمت / حوزه فعالیت شخصی کاربر (متن آزاد، جدا از specialty قدیمی)
alter table user_profiles add column if not exists job_title text;
alter table user_profiles add column if not exists activity_field text;

-- اطلاعات شرکت/مجموعه
alter table user_profiles add column if not exists company_activity_type text
  check (company_activity_type is null or company_activity_type in
    ('mine','processing_plant','trading','contractor','mining_services','individual'));
alter table user_profiles add column if not exists company_registration_id text;
alter table user_profiles add column if not exists company_province text;
alter table user_profiles add column if not exists company_city text;
alter table user_profiles add column if not exists company_address text;
alter table user_profiles add column if not exists company_website text;

-- ستون قدیمی company_national_id همان شناسه ملی شرکت است؛ برای هماهنگی نگه داشته می‌شود.

-- ============================================================
-- توجه دستی (خارج از این فایل، در Supabase Dashboard):
-- برای آپلود عکس پروفایل، یک باکت استوریج به نام profile-images
-- بسازید (Storage > New bucket > Public) — دقیقا مثل باکت ad-images.
-- ============================================================

-- ============================================================
-- (اجراشده روی Supabase از طریق اتصال مستقیم) — همچنین برای مستندسازی این‌جا نگه داشته شده:
-- سفت‌کردن RLS جدول‌های ads و bids را در فایل زیر ببینید:
-- migration_003_tighten_rls.sql
-- ============================================================
