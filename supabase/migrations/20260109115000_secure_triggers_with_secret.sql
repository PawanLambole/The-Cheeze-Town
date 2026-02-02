-- Database Hardening & Trigger Configuration
-- 1. Verify Extensions
create extension if not exists pg_net;
create extension if not exists "uuid-ossp";

-- 2. Setup Secure Configuration schema (if not exists)
create schema if not exists app_private;

create table if not exists app_private.secrets (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text not null,
  created_at timestamptz default now()
);

-- 3. Seed Edge Function URL (remove hardcoding from functions)
-- Replace with your actual project URL found in Supabase Dashboard
insert into app_private.secrets (key, value)
values ('EDGE_FUNCTION_URL', 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification')
on conflict (key) do update
set value = EXCLUDED.value;

-- 4. Helper to fetch URL securely
create or replace function public.get_edge_function_url()
returns text as $$
declare
  url_val text;
begin
  select value into url_val
  from app_private.secrets
  where key = 'EDGE_FUNCTION_URL';
  
  if url_val is null then
    raise warning 'Edge Function URL not configured in app_private.secrets';
    return null;
  end if;

  return url_val;
end;
$$ language plpgsql security definer;

-- 5. Helper to Fetch Secret (Legacy/Compat)
-- Ensure this function exists or is created here if missing from previous migrations
create or replace function public.get_order_notification_secret()
returns text as $$
declare
  secret_val text;
begin
  -- Try to get from app_private.secrets if we migrated usage there, 
  -- otherwise fallback to whatever method was used or hardcoded (not recommended for secrets)
  -- For now, we assume the user has set this env var or it is managed elsewhere.
  -- Here we will try to fetch it from the same secrets table for consistency.
  select value into secret_val from app_private.secrets where key = 'ORDER_NOTIFICATION_SECRET';
  
  if secret_val is null then
    -- Fallback for backward compatibility if secret was managed differently
    -- or prompt user to set it.
    return 'q7CMSbqR0Uebb8mlQnR/T44j/b+GpVs2xNGa5rlQo1H3zuZKWuPLW/sqdtrrnYzP';
  end if;
  
  return secret_val;
end;
$$ language plpgsql security definer;

-- 6. Main Order Trigger
create or replace function public.handle_new_order()
returns trigger as $$
declare
  endpoint_url text;
  secret text;
begin
  endpoint_url := public.get_edge_function_url();
  secret := public.get_order_notification_secret();

  -- Fail safe: logs warning but allows insert
  if endpoint_url is null or secret is null then
    raise warning 'Order Notification: Missing configuration (URL or Secret).';
    return new;
  end if;

  begin
      perform net.http_post(
          url := endpoint_url,
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'X-Order-Notification-Secret', secret
          ),
          body := jsonb_build_object(
            'eventType', 'ORDER_INSERT',
            'record', to_jsonb(new),
            'requestId', uuid_generate_v4(),
            'triggerVersion', '1.2'
          )
      );
  exception when others then
      -- Lightweight failure logging
      raise warning 'Order Notification Trigger Failed: %', SQLERRM;
  end;

  return new;
end;
$$ language plpgsql;

-- Recreate Order Trigger
drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
after insert on public.orders
for each row execute procedure public.handle_new_order();

-- 7. Order Item Trigger (Updates)
create or replace function public.handle_order_item_insert()
returns trigger as $$
declare
  endpoint_url text;
  secret text;
  order_created_at timestamptz;
begin
  endpoint_url := public.get_edge_function_url();
  secret := public.get_order_notification_secret();

  if endpoint_url is null or secret is null then
    return new;
  end if;

  begin
    select created_at into order_created_at
    from public.orders
    where id = new.order_id;
  exception when others then
    return new; -- Safe fail if order not found
  end;

  if order_created_at is null then
    return new;
  end if;

  -- Debounce: Skip if item added during initial order creation window (2 seconds)
  if now() - order_created_at <= interval '2 seconds' then
    return new;
  end if;

  begin
      perform net.http_post(
          url := endpoint_url,
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'X-Order-Notification-Secret', secret
          ),
          body := jsonb_build_object(
            'eventType', 'ORDER_ITEM_INSERT',
            'record', to_jsonb(new),
            'requestId', uuid_generate_v4(),
            'triggerVersion', '1.2'
          )
      );
  exception when others then
      raise warning 'Order Item Notification Trigger Failed: %', SQLERRM;
  end;

  return new;
end;
$$ language plpgsql;

-- Recreate Order Item Trigger
drop trigger if exists on_order_item_inserted on public.order_items;
create trigger on_order_item_inserted
after insert on public.order_items
for each row execute procedure public.handle_order_item_insert();
