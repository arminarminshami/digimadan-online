-- ============================================================
-- Migration 003 — سفت‌کردن دسترسی RLS روی ads و bids
-- (این فایل روی دیتابیس واقعی از طریق اتصال مستقیم اجرا شد؛
--  این‌جا فقط برای مستندسازی و پشتیبان نگه داشته می‌شود)
-- ============================================================

drop policy if exists "Authenticated full access ads" on ads;

create policy "Admin full access ads"
  on ads for all
  to authenticated
  using (exists (select 1 from admin_users au where au.auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users au where au.auth_user_id = auth.uid()));

create policy "Authenticated can view listed or own ads"
  on ads for select
  to authenticated
  using (status in ('published', 'live', 'sold') or owner_user_id = auth.uid());

create policy "Owners can insert own ads"
  on ads for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "Owners can update own ads"
  on ads for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Owners can delete own ads"
  on ads for delete
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "Public can read published ads" on ads;
create policy "Public can read published or live ads"
  on ads for select
  to anon
  using (status in ('published', 'live', 'sold'));

drop policy if exists "Admin full access bids" on bids;

create policy "Admin full access bids"
  on bids for all
  to authenticated
  using (exists (select 1 from admin_users au where au.auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users au where au.auth_user_id = auth.uid()));

create policy "Authenticated can read bids"
  on bids for select
  to authenticated
  using (true);
