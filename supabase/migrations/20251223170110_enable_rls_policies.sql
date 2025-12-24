-- Enable Row Level Security (RLS) and define basic policies
-- for core application tables in the public schema.

-- Helper: convenience checks for roles based on public.users.role
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role = 'owner'
	);
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
as $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role = 'manager'
	);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
	select exists (
		select 1 from public.users
		where id = auth.uid()
			and role in ('owner', 'manager', 'chef', 'waiter', 'staff')
	);
$$;

-- USERS --------------------------------------------------------------------

alter table public.users enable row level security;

-- Users can see and update their own profile
create policy "Users can read own profile" on public.users
	for select
	using (auth.uid() = id);

create policy "Users can update own profile" on public.users
	for update
	using (auth.uid() = id)
	with check (auth.uid() = id);

-- Owners/managers can manage all users
create policy "Admins can manage all users" on public.users
	for all
	using (public.is_owner() or public.is_manager())
	with check (public.is_owner() or public.is_manager());

-- MENU CATEGORIES ----------------------------------------------------------

alter table public.menu_categories enable row level security;

-- Anyone (including anon) can read menu categories
create policy "Public read menu_categories" on public.menu_categories
	for select
	using (true);

-- Only staff can modify menu categories
create policy "Staff manage menu_categories" on public.menu_categories
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- MENU ITEMS ---------------------------------------------------------------

alter table public.menu_items enable row level security;

-- Anyone can read available menu items
create policy "Public read menu_items" on public.menu_items
	for select
	using (is_available = true);

-- Staff manage menu items
create policy "Staff manage menu_items" on public.menu_items
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- RESTAURANT TABLES --------------------------------------------------------

alter table public.restaurant_tables enable row level security;

-- Anyone can see table layout/status (for customer UI)
create policy "Public read restaurant_tables" on public.restaurant_tables
	for select
	using (true);

-- Staff manage tables
create policy "Staff manage restaurant_tables" on public.restaurant_tables
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- ORDERS -------------------------------------------------------------------

alter table public.orders enable row level security;

-- Customers can see their own orders
create policy "Customers read own orders" on public.orders
	for select
	using (auth.uid() = customer_id);

-- Staff can manage all orders
create policy "Staff manage orders" on public.orders
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- ORDER ITEMS --------------------------------------------------------------

alter table public.order_items enable row level security;

-- Link order_items to access rights on parent order
create policy "Customers read own order_items" on public.order_items
	for select
	using (exists (
		select 1 from public.orders o
		where o.id = order_items.order_id
			and o.customer_id = auth.uid()
	));

create policy "Staff manage order_items" on public.order_items
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- PAYMENTS -----------------------------------------------------------------

alter table public.payments enable row level security;

create policy "Customers read own payments" on public.payments
	for select
	using (exists (
		select 1 from public.orders o
		where o.id = payments.order_id
			and o.customer_id = auth.uid()
	));

create policy "Staff manage payments" on public.payments
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- PURCHASES ----------------------------------------------------------------

alter table public.purchases enable row level security;

create policy "Staff manage purchases" on public.purchases
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- INVENTORY ----------------------------------------------------------------

alter table public.inventory enable row level security;

create policy "Staff read inventory" on public.inventory
	for select
	using (public.is_staff());

create policy "Staff manage inventory" on public.inventory
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- EXPENSES -----------------------------------------------------------------

alter table public.expenses enable row level security;

create policy "Staff read expenses" on public.expenses
	for select
	using (public.is_staff());

create policy "Staff manage expenses" on public.expenses
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- RESERVATIONS -------------------------------------------------------------

alter table public.reservations enable row level security;

create policy "Customers read own reservations" on public.reservations
	for select
	using (customer_phone is not null and auth.uid() is not null
				 or created_by = auth.uid());

create policy "Staff manage reservations" on public.reservations
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- FEEDBACK -----------------------------------------------------------------

alter table public.feedback enable row level security;

create policy "Customers read own feedback" on public.feedback
	for select
	using (customer_id = auth.uid());

create policy "Staff manage feedback" on public.feedback
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- ATTENDANCE ---------------------------------------------------------------

alter table public.attendance enable row level security;

create policy "Staff read own attendance" on public.attendance
	for select
	using (exists (
		select 1 from public.staff s
		where s.id = attendance.staff_id
			and s.user_id = auth.uid()
	));

create policy "Staff manage attendance" on public.attendance
	for all
	using (public.is_staff())
	with check (public.is_staff());

-- STAFF --------------------------------------------------------------------

alter table public.staff enable row level security;

create policy "Staff read own staff row" on public.staff
	for select
	using (user_id = auth.uid());

create policy "Admins manage staff" on public.staff
	for all
	using (public.is_owner() or public.is_manager())
	with check (public.is_owner() or public.is_manager());

-- STAFF PAYMENTS -----------------------------------------------------------

alter table public.staff_payments enable row level security;

create policy "Staff read own payments" on public.staff_payments
	for select
	using (exists (
		select 1 from public.staff s
		where s.id = staff_payments.staff_id
			and s.user_id = auth.uid()
	));

create policy "Admins manage staff_payments" on public.staff_payments
	for all
	using (public.is_owner() or public.is_manager())
	with check (public.is_owner() or public.is_manager());

