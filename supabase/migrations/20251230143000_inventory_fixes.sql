-- Make is_staff security definer to avoid RLS recursion/permission issues
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role in ('owner', 'manager', 'chef', 'waiter', 'staff')
	);
$$;
