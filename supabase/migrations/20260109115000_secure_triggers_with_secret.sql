-- Re-secure triggers to include a shared secret header.
-- Requires app_private.secrets + public.get_order_notification_secret() (see prior migration).

create extension if not exists pg_net;

create or replace function public.handle_new_order()
returns trigger as $$
declare
  url text := 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification';
  secret text := public.get_order_notification_secret();
begin
  if secret is null or length(secret) = 0 then
    return new;
  end if;

  perform net.http_post(
      url := url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Order-Notification-Secret', secret
      ),
      body := jsonb_build_object(
        'eventType', 'ORDER_INSERT',
        'record', to_jsonb(new)
      )
  );

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
after insert on public.orders
for each row execute procedure public.handle_new_order();

create or replace function public.handle_order_item_insert()
returns trigger as $$
declare
  url text := 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification';
  secret text := public.get_order_notification_secret();
  order_created_at timestamptz;
begin
  if secret is null or length(secret) = 0 then
    return new;
  end if;

  select created_at into order_created_at
  from public.orders
  where id = new.order_id;

  if order_created_at is null then
    return new;
  end if;

  if now() - order_created_at <= interval '2 seconds' then
    return new;
  end if;

  perform net.http_post(
      url := url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Order-Notification-Secret', secret
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
