-- Fix purchases table columns
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='purchase_type') then
        alter table purchases add column purchase_type text check (purchase_type in ('inventory', 'other')) not null default 'other';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='item_name') then
        alter table purchases add column item_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='category') then
        alter table purchases add column category text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='quantity') then
        alter table purchases add column quantity decimal not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='unit') then
        alter table purchases add column unit text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='total_price') then
        alter table purchases add column total_price decimal not null default 0;
    end if;
    -- assigned_to was done
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='supplier') then
        alter table purchases add column supplier text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='purchase_date') then
        alter table purchases add column purchase_date date default CURRENT_DATE;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='receipt_photo') then
        alter table purchases add column receipt_photo text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='purchases' and column_name='notes') then
        alter table purchases add column notes text;
    end if;
end $$;

-- Fix orders table columns (just in case)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='order_number') then
        alter table orders add column order_number text unique;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='table_id') then
        alter table orders add column table_id bigint references restaurant_tables(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='customer_name') then
        alter table orders add column customer_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='status') then
        alter table orders add column status text check (status in ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')) default 'pending';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='total_amount') then
        alter table orders add column total_amount decimal not null default 0;
    end if;
     if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='is_paid') then
        alter table orders add column is_paid boolean default false;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='transaction_id') then
        alter table orders add column transaction_id text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='payment_method') then
        alter table orders add column payment_method text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='completed_time') then
        alter table orders add column completed_time timestamp with time zone;
    end if;
end $$;
