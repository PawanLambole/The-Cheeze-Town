-- Clean up test policy
drop policy if exists "Test Policy" on storage.objects;

-- Enable RLS (just in case)
alter table storage.objects enable row level security;

-- Public Access
drop policy if exists "Public Access Menu Images" on storage.objects;
create policy "Public Access Menu Images"
on storage.objects for select
using ( bucket_id = 'menu' );

-- Staff Upload
drop policy if exists "Staff Upload Menu Images" on storage.objects;
create policy "Staff Upload Menu Images"
on storage.objects for insert
with check (
  bucket_id = 'menu' 
  and public.is_staff()
);

-- Staff Update
drop policy if exists "Staff Update Menu Images" on storage.objects;
create policy "Staff Update Menu Images"
on storage.objects for update
using (
  bucket_id = 'menu'
  and public.is_staff()
);

-- Staff Delete
drop policy if exists "Staff Delete Menu Images" on storage.objects;
create policy "Staff Delete Menu Images"
on storage.objects for delete
using (
  bucket_id = 'menu'
  and public.is_staff()
);
