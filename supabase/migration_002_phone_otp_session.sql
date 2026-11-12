-- DigiMadan — phone OTP identity mapping
-- The custom OTP Edge Function uses this table to map an Iranian mobile
-- number to the corresponding Supabase Auth user.

create table if not exists phone_identities (
  phone text primary key,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists phone_identities_auth_user_id_idx
  on phone_identities (auth_user_id);

alter table phone_identities enable row level security;

-- No anon/authenticated policies on purpose. The table is accessed by the
-- otp-auth Edge Function with the service-role key only.
