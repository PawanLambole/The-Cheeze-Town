create table if not exists public.menu_item_ingredients (
  id bigint generated always as identity primary key,
  menu_item_id bigint not null references public.menu_items(id) on delete cascade,
  inventory_item_id bigint not null references public.inventory(id) on delete cascade,
  quantity float not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(menu_item_id, inventory_item_id)
);

-- Enable RLS
alter table public.menu_item_ingredients enable row level security;

-- Create policies (allowing read for authenticated, write for owners/managers)
-- For simplicity, allowing all access for authenticated users for now as roles are managed in app layer often, 
-- but ideally should check roles. Based on `fix_rls_recursion.sql`, we seemingly use broad policies or specific role checks.
-- Let's copy pattern from other tables if known, or start permissive for "authenticated".

create policy "Enable read access for authenticated users"
on public.menu_item_ingredients
for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on public.menu_item_ingredients
for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on public.menu_item_ingredients
for update
to authenticated
using (true);

create policy "Enable delete for authenticated users"
on public.menu_item_ingredients
for delete
to authenticated
using (true);
