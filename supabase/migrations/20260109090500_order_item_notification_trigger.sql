-- Send push notifications when items are added to an existing order
-- Avoid spam during initial order creation by skipping item inserts that happen right after the order is created.

create extension if not exists pg_net;

create or replace function public.handle_order_item_insert()
returns trigger as $$
declare
  supabase_anon_key text := current_setting('app.settings.supabase_anon_key', true);
  url text := 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification';
  order_created_at timestamptz;
begin
  select created_at into order_created_at
  from public.orders
  where id = new.order_id;

  -- If we can't find the parent order, do nothing.
  if order_created_at is null then
    return new;
  end if;

  -- If this item was inserted within 2 seconds of the order creation,
  -- treat it as part of the initial order insert flow and skip.
  if now() - order_created_at <= interval '2 seconds' then
    return new;
  end if;

  perform net.http_post(
      url := url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(supabase_anon_key, ''),
          'apikey', coalesce(supabase_anon_key, '')
      ),
      body := jsonb_build_object(
        'eventType', 'ORDER_ITEM_INSERT',
        'record', to_jsonb(new)
      )
  );

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_order_item_inserted on public.order_items;
create trigger on_order_item_inserted
after insert on public.order_items
for each row execute procedure public.handle_order_item_insert();
