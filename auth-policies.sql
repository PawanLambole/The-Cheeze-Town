-- =====================================================
-- AUTHENTICATION SETUP
-- =====================================================
-- This script sets up proper authentication and RLS policies
-- Run this in Supabase SQL Editor AFTER creating initial schema
-- =====================================================

-- 1. Add auth_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'waiter';

-- Add constraint to ensure role is valid
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE users ADD CONSTRAINT valid_role 
  CHECK (role IN ('owner', 'manager', 'chef', 'waiter', 'customer'));

-- =====================================================
-- 2. CREATE RLS POLICIES
-- =====================================================

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow all on ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow public read on ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow authenticated users to read ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow authenticated users to insert ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow authenticated users to update ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow authenticated users to delete ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow authenticated users all on ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow anon read on ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('Allow anon insert on ' || r.tablename) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Owners and managers can view all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners can manage users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- =====================================================
-- MENU (Public Read, Staff Write)
-- =====================================================
CREATE POLICY "Anyone can view menu categories" ON menu_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can manage categories" ON menu_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Anyone can view menu items" ON menu_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can manage menu items" ON menu_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- TABLES
-- =====================================================
CREATE POLICY "Staff can view tables" ON restaurant_tables
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Managers can manage tables" ON restaurant_tables
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- ORDERS
-- =====================================================
CREATE POLICY "Staff can view orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Waiters and managers can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Managers can delete orders" ON orders
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- ORDER ITEMS
-- =====================================================
CREATE POLICY "Staff can view order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Waiters can manage order items" ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE POLICY "Staff can view payments" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

CREATE POLICY "Staff can create payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

-- =====================================================
-- STAFF & RELATED
-- =====================================================
CREATE POLICY "Staff can view staff list" ON staff
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Managers can manage staff" ON staff
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Managers can manage staff payments" ON staff_payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Staff can view attendance" ON attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef', 'waiter')
    )
  );

CREATE POLICY "Managers can manage attendance" ON attendance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- INVENTORY & PURCHASES
-- =====================================================
CREATE POLICY "Staff can view inventory" ON inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'chef')
    )
  );

CREATE POLICY "Managers can manage inventory" ON inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Managers can manage purchases" ON purchases
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- EXPENSES
-- =====================================================
CREATE POLICY "Managers can manage expenses" ON expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- RESERVATIONS
-- =====================================================
CREATE POLICY "Staff can view reservations" ON reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

CREATE POLICY "Staff can manage reservations" ON reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager', 'waiter')
    )
  );

-- =====================================================
-- FEEDBACK
-- =====================================================
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can view feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- 3. VERIFY RLS IS ENABLED
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Authentication & RLS Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create test users in Supabase Auth dashboard';
    RAISE NOTICE '2. Link auth users to users table';
    RAISE NOTICE '3. Test login in your app';
    RAISE NOTICE '========================================';
END $$;
