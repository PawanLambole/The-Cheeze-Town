-- Baseline schema for The Cheeze Town
-- Generated from types/database.ts and app usage

create extension if not exists "pgcrypto";

-- USERS
create table if not exists public.users (
	id uuid primary key default gen_random_uuid(),
	email text not null unique,
	name text,
	phone text,
	avatar_url text,
	role text,
	auth_id uuid,
	is_active boolean default true,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- MENU CATEGORIES
create table if not exists public.menu_categories (
	id serial primary key,
	name text not null,
	description text,
	display_order integer default 0,
	is_active boolean default true,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- MENU ITEMS
create table if not exists public.menu_items (
	id serial primary key,
	name text not null,
	description text,
	price numeric not null,
	category_id integer references public.menu_categories(id),
	category text,
	image_url text,
	is_available boolean default true,
	is_vegetarian boolean default false,
	is_spicy boolean default false,
	preparation_time integer,
	calories integer,
	ingredients text[],
	allergens text[],
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- RESTAURANT TABLES
create table if not exists public.restaurant_tables (
	id serial primary key,
	table_number integer not null unique,
	capacity integer not null default 4,
	status text,
	current_order_id integer,
	location text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- ORDERS
create table if not exists public.orders (
	id serial primary key,
	order_number text not null unique,
	table_id integer references public.restaurant_tables(id),
	customer_id uuid references public.users(id),
	waiter_id uuid references public.users(id),
	status text,
	order_type text,
	subtotal numeric,
	tax_amount numeric,
	discount_amount numeric,
	total_amount numeric not null default 0,
	notes text,
	is_served boolean default false,
	order_time timestamptz default now(),
	prepared_time timestamptz,
	served_time timestamptz,
	completed_time timestamptz,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

alter table public.restaurant_tables
	add constraint restaurant_tables_current_order_id_fkey
	foreign key (current_order_id) references public.orders(id);

-- ORDER ITEMS
create table if not exists public.order_items (
	id serial primary key,
	order_id integer references public.orders(id) on delete cascade,
	menu_item_id integer references public.menu_items(id),
	menu_item_name text not null,
	quantity integer not null default 1,
	unit_price numeric not null,
	total_price numeric not null,
	special_instructions text,
	status text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- PAYMENTS
create table if not exists public.payments (
	id serial primary key,
	order_id integer references public.orders(id),
	amount numeric not null,
	payment_method text,
	status text,
	transaction_id text,
	payment_date timestamptz default now(),
	processed_by uuid references public.users(id),
	notes text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- PURCHASES
create table if not exists public.purchases (
	id serial primary key,
	item_name text not null,
	category text,
	quantity numeric not null,
	unit text,
	unit_price numeric not null,
	total_amount numeric not null,
	vendor_name text,
	vendor_contact text,
	invoice_number text,
	receipt_url text,
	purchase_date date default current_date,
	purchased_by uuid references public.users(id),
	notes text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- INVENTORY
create table if not exists public.inventory (
	id serial primary key,
	item_name text not null,
	category text,
	quantity numeric not null default 0,
	unit text,
	reorder_level numeric,
	unit_cost numeric,
	supplier text,
	last_restock_date date,
	expiry_date date,
	location text,
	status text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- EXPENSES
create table if not exists public.expenses (
	id serial primary key,
	expense_type text not null,
	amount numeric not null,
	description text,
	category text,
	payment_method text,
	receipt_url text,
	expense_date date default current_date,
	recorded_by uuid references public.users(id),
	vendor_name text,
	is_recurring boolean default false,
	recurring_period text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- RESERVATIONS
create table if not exists public.reservations (
	id serial primary key,
	customer_name text not null,
	customer_phone text not null,
	customer_email text,
	table_id integer references public.restaurant_tables(id),
	reservation_date date not null,
	reservation_time time not null,
	party_size integer not null,
	status text,
	special_requests text,
	created_by uuid references public.users(id),
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- FEEDBACK
create table if not exists public.feedback (
	id serial primary key,
	order_id integer references public.orders(id),
	customer_id uuid references public.users(id),
	rating integer,
	food_rating integer,
	service_rating integer,
	ambience_rating integer,
	comments text,
	would_recommend boolean,
	created_at timestamptz default now()
);

-- ATTENDANCE
create table if not exists public.attendance (
	id serial primary key,
	staff_id integer,
	date date default current_date,
	check_in_time timestamptz,
	check_out_time timestamptz,
	status text,
	notes text,
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	unique (staff_id, date)
);

-- STAFF
create table if not exists public.staff (
	id serial primary key,
	user_id uuid unique references public.users(id),
	employee_id text unique,
	position text not null,
	department text,
	salary numeric,
	hire_date date default current_date,
	termination_date date,
	status text,
	emergency_contact text,
	address text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- STAFF PAYMENTS
create table if not exists public.staff_payments (
	id serial primary key,
	staff_id integer references public.staff(id),
	amount numeric not null,
	payment_type text,
	payment_date date default current_date,
	period_start date,
	period_end date,
	notes text,
	paid_by uuid references public.users(id),
	created_at timestamptz default now()
);

