-- Enable pg_net extension for making HTTP requests
create extension if not exists pg_net;

-- Function to handle new order inserts
create or replace function public.handle_new_order()
returns trigger as $$
declare
  -- Service Role Key for authentication
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';
  url text := 'https://gnpdhisyxwqvnjleyola.supabase.co/functions/v1/order-notification';
begin
  -- Perform HTTP POST to the Edge Function
  -- We wrap the record in a 'record' object to match the function's expectation
  perform net.http_post(
      url := url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$ language plpgsql;

-- Create the trigger
drop trigger if exists on_order_created on public.orders;

create trigger on_order_created
after insert on public.orders
for each row execute procedure public.handle_new_order();
