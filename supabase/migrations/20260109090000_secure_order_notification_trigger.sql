-- Secure order notification trigger (no embedded secrets)

-- Ensure pg_net is available
create extension if not exists pg_net;

-- Calls the order-notification Edge Function using the Supabase anon key stored as a DB setting.
-- Set once in Supabase SQL Editor:
--   alter database postgres set app.settings.supabase_anon_key = '<YOUR_SUPABASE_ANON_KEY>';
create or replace function public.handle_new_order()
returns trigger as $$
declare
  supabase_anon_key text := current_setting('app.settings.supabase_anon_key', true);
  url text := 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification';
begin
  perform net.http_post(
      url := url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(supabase_anon_key, ''),
          'apikey', coalesce(supabase_anon_key, '')
      ),
      body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
end;
$$ language plpgsql;

-- Ensure trigger points at the latest function body
drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
after insert on public.orders
for each row execute procedure public.handle_new_order();
