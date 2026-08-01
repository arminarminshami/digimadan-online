-- ============================================================
-- DigiMadan.com — Supabase Storage policies
--
-- BEFORE running this file:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a bucket named "ad-images"   -> set Public = ON
-- 3. Create a bucket named "banner-images" -> set Public = ON
--
-- THEN run this file in SQL Editor to allow admin uploads/deletes
-- while keeping public read access (since buckets are public).
-- ============================================================

-- Allow any authenticated (logged-in admin) user to upload/update/delete
-- in both buckets. Public read works automatically because the buckets
-- are marked Public in the dashboard.

drop policy if exists "Authenticated upload ad-images" on storage.objects;
create policy "Authenticated upload ad-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ad-images');

drop policy if exists "Authenticated update ad-images" on storage.objects;
create policy "Authenticated update ad-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ad-images');

drop policy if exists "Authenticated delete ad-images" on storage.objects;
create policy "Authenticated delete ad-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ad-images');

drop policy if exists "Authenticated upload banner-images" on storage.objects;
create policy "Authenticated upload banner-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banner-images');

drop policy if exists "Authenticated update banner-images" on storage.objects;
create policy "Authenticated update banner-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banner-images');

drop policy if exists "Authenticated delete banner-images" on storage.objects;
create policy "Authenticated delete banner-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banner-images');
