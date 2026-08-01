-- ============================================================
-- تابع جست‌وجوی سراسری سایت
-- روی داده‌ی زنده‌ی جداول اجرا می‌شود (نه یک ایندکس جداگانه)، پس با هر
-- تغییری در سایت (آگهی جدید، مقاله جدید، ویرایش قیمت و ...) بلافاصله
-- و بدون نیاز به هیچ هماهنگی اضافه به‌روز می‌ماند.
-- ============================================================

create or replace function public.global_search(search_term text)
returns table (
  result_type text,
  ref_id text,
  ref_title text,
  snippet text,
  url text
)
language sql
security definer
set search_path = public
stable
as $$
  with term as (select '%' || trim(search_term) || '%' as t)

  select 'آگهی' as result_type, id::text as ref_id, title as ref_title,
         left(coalesce(description, ''), 140) as snippet,
         '/ads/' || id::text as url
  from ads, term
  where status in ('published', 'live')
    and is_archived = false
    and (title ilike term.t or coalesce(description,'') ilike term.t
         or coalesce(mineral_type,'') ilike term.t or coalesce(province,'') ilike term.t)

  union all
  select 'مقاله', id::text, title, left(coalesce(content,''), 140), '/articles/' || slug
  from articles, term
  where status = 'published'
    and (title ilike term.t or coalesce(content,'') ilike term.t)

  union all
  select 'خبر', id::text, title, left(coalesce(summary,''), 140), '/news'
  from news_items, term
  where title ilike term.t or coalesce(summary,'') ilike term.t

  union all
  select 'صفحه', id::text, title, left(coalesce(content,''), 140), '/page/' || slug
  from pages, term
  where title ilike term.t or coalesce(content,'') ilike term.t

  union all
  select 'قیمت', key, label_fa, unit, '/prices'
  from price_items, term
  where is_active = true and label_fa ilike term.t

  limit 60;
$$;

grant execute on function public.global_search(text) to anon, authenticated;
