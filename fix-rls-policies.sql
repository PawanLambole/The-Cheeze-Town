-- =====================================================
-- TEMPORARY FIX: Allow Anonymous Access for Testing
-- =====================================================
-- This script temporarily allows READ access without authentication
-- Run this in Supabase SQL Editor to enable data access
--
-- IMPORTANT: For production, you should implement proper authentication
-- and use more restrictive RLS policies
-- =====================================================

-- Drop existing restrictive policies and create permissive ones for testing

-- TABLES
DROP POLICY IF EXISTS "Allow public read on restaurant_tables" ON restaurant_tables;
CREATE POLICY "Allow all on restaurant_tables" ON restaurant_tables FOR ALL USING (true) WITH CHECK (true);

-- ORDERS
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ORDER ITEMS
DROP POLICY IF EXISTS "Allow authenticated users to read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated users to update order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete order_items" ON order_items;
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- MENU ITEMS & CATEGORIES
DROP POLICY IF EXISTS "Allow public read on menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow anon read on menu_items" ON menu_items;
CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on menu_categories" ON menu_categories;
CREATE POLICY "Allow all on menu_categories" ON menu_categories FOR ALL USING (true) WITH CHECK (true);

-- PAYMENTS
DROP POLICY IF EXISTS "Allow authenticated users all on payments" ON payments;
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- STAFF
DROP POLICY IF EXISTS "Allow authenticated users all on staff" ON staff;
CREATE POLICY "Allow all on staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- STAFF PAYMENTS
DROP POLICY IF EXISTS "Allow authenticated users all on staff_payments" ON staff_payments;
CREATE POLICY "Allow all on staff_payments" ON staff_payments FOR ALL USING (true) WITH CHECK (true);

-- PURCHASES
DROP POLICY IF EXISTS "Allow authenticated users all on purchases" ON purchases;
CREATE POLICY "Allow all on purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);

-- INVENTORY
DROP POLICY IF EXISTS "Allow authenticated users all on inventory" ON inventory;
CREATE POLICY "Allow all on inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- EXPENSES
DROP POLICY IF EXISTS "Allow authenticated users all on expenses" ON expenses;
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- RESERVATIONS
DROP POLICY IF EXISTS "Allow authenticated users all on reservations" ON reservations;
CREATE POLICY "Allow all on reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);

-- FEEDBACK
DROP POLICY IF EXISTS "Allow authenticated users all on feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anon insert on feedback" ON feedback;
CREATE POLICY "Allow all on feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE
DROP POLICY IF EXISTS "Allow authenticated users all on attendance" ON attendance;
CREATE POLICY "Allow all on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- USERS
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICATION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS policies updated for testing!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All tables now allow anonymous access';
    RAISE NOTICE 'Your app should now be able to read/write data';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: This is for testing only!';
    RAISE NOTICE 'Implement authentication for production';
    RAISE NOTICE '========================================';
END $$;
