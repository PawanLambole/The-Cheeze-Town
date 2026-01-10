-- Store a shared secret in the database for calling Edge Functions securely from triggers.
-- IMPORTANT: Do NOT store the secret in this migration file.
-- After applying this migration, set it manually in Supabase SQL Editor:
--   insert into app_private.secrets(key, value)
--   values ('order_notification_secret', '<RANDOM_SECRET>')
--   on conflict (key) do update set value = excluded.value, updated_at = now();

create schema if not exists app_private;

revoke all on schema app_private from public;

create table if not exists app_private.secrets (
  key text primary key,
  value text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prevent accidental exposure via PostgREST
revoke all on app_private.secrets from public;

create or replace function public.get_order_notification_secret()
returns text
language sql
security definer
set search_path = public, app_private
as $$
  select s.value from app_private.secrets s where s.key = 'order_notification_secret' limit 1;
$$;

revoke all on function public.get_order_notification_secret() from public;
