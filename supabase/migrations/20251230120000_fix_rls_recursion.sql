-- Fix RLS recursion by using SECURITY DEFINER
-- This ensures the role check functions execute with the privileges of the function creator (postgres),
-- bypassing RLS on public.users table during the check.

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role = 'manager'
	);
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role = 'owner'
	);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role in ('owner', 'manager', 'chef', 'waiter', 'staff')
	);
$$;
