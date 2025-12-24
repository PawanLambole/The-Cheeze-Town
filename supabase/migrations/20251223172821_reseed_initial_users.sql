-- Reseed initial application users (owner, manager, chef)
-- Use ON CONFLICT so this is safe to run multiple times.

insert into public.users (id, email, name, role, is_active, created_at, updated_at)
select
	au.id,
	au.email,
	'Owner'::text as name,
	'owner'::text as role,
	true as is_active,
	now() as created_at,
	now() as updated_at
from auth.users au
where au.email = 'thecheesetown@gmail.com'
on conflict (email) do update
	set id = excluded.id,
			name = excluded.name,
			role = excluded.role,
			is_active = excluded.is_active,
			updated_at = now();

insert into public.users (id, email, name, role, is_active, created_at, updated_at)
select
	au.id,
	au.email,
	'Manager'::text as name,
	'manager'::text as role,
	true as is_active,
	now() as created_at,
	now() as updated_at
from auth.users au
where au.email = 'manager@thecheesetown.com'
on conflict (email) do update
	set id = excluded.id,
			name = excluded.name,
			role = excluded.role,
			is_active = excluded.is_active,
			updated_at = now();

insert into public.users (id, email, name, role, is_active, created_at, updated_at)
select
	au.id,
	au.email,
	'Chef'::text as name,
	'chef'::text as role,
	true as is_active,
	now() as created_at,
	now() as updated_at
from auth.users au
where au.email = 'chef@thecheesetown.com'
on conflict (email) do update
	set id = excluded.id,
			name = excluded.name,
			role = excluded.role,
			is_active = excluded.is_active,
			updated_at = now();

