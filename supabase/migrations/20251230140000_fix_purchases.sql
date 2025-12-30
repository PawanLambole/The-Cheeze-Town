-- Add purchase_type column to purchases table
alter table public.purchases 
add column if not exists purchase_type text default 'inventory';

-- Enable RLS on storage.objects (if not already enabled)
-- alter table storage.objects enable row level security;

-- Purchase Bucket Policies

-- Public Read
drop policy if exists "Public Access Purchase Images" on storage.objects;
create policy "Public Access Purchase Images"
on storage.objects for select
using ( bucket_id = 'purchase' );

-- Staff Upload
drop policy if exists "Staff Upload Purchase Images" on storage.objects;
create policy "Staff Upload Purchase Images"
on storage.objects for insert
with check (
  bucket_id = 'purchase' 
  and public.is_staff()
);

-- Staff Update
drop policy if exists "Staff Update Purchase Images" on storage.objects;
create policy "Staff Update Purchase Images"
on storage.objects for update
using (
  bucket_id = 'purchase'
  and public.is_staff()
);

-- Staff Delete
drop policy if exists "Staff Delete Purchase Images" on storage.objects;
create policy "Staff Delete Purchase Images"
on storage.objects for delete
using (
  bucket_id = 'purchase'
  and public.is_staff()
);
