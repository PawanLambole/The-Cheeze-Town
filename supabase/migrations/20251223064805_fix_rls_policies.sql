-- Fix RLS policies to allow customer web access
-- This migration drops all policies and recreates them with proper permissions

-- Drop ALL existing policies on these tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON menu_items';
    END LOOP;
    
    -- Drop all policies on restaurant_tables
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurant_tables') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON restaurant_tables';
    END LOOP;
    
    -- Drop all policies on orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON orders';
    END LOOP;
    
    -- Drop all policies on order_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON order_items';
    END LOOP;
END $$;

-- Menu Items Policies
CREATE POLICY "select_approved_menu_items"
  ON menu_items
  FOR SELECT
  USING (status = 'approved' OR auth.role() = 'authenticated');

CREATE POLICY "insert_menu_items_auth"
  ON menu_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "update_menu_items_auth"
  ON menu_items
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "delete_menu_items_auth"
  ON menu_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Restaurant Tables Policies
CREATE POLICY "select_all_tables"
  ON restaurant_tables
  FOR SELECT
  USING (true);

CREATE POLICY "insert_tables_auth"
  ON restaurant_tables
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "update_tables_auth"
  ON restaurant_tables
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "delete_tables_auth"
  ON restaurant_tables
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Orders Policies (Allow anonymous to create and read)
CREATE POLICY "insert_orders_public"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_orders_public"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "update_orders_auth"
  ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "delete_orders_auth"
  ON orders
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Order Items Policies (Allow anonymous to create and read)
CREATE POLICY "insert_order_items_public"
  ON order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_order_items_public"
  ON order_items
  FOR SELECT
  USING (true);

CREATE POLICY "update_order_items_auth"
  ON order_items
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "delete_order_items_auth"
  ON order_items
  FOR DELETE
  USING (auth.role() = 'authenticated');
