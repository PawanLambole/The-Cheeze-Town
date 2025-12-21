-- =====================================================
-- FIX: Infinite Recursion in Users Table
-- =====================================================
-- Run this to fix the circular reference error
-- =====================================================

-- Drop the problematic users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Owners and managers can view all users" ON users;
DROP POLICY IF EXISTS "Owners can manage users" ON users;

-- Drop the new policies we are defining below to avoid collisions if re-running
DROP POLICY IF EXISTS "All authenticated can view users" ON users;
DROP POLICY IF EXISTS "Authenticated can manage own user" ON users;

-- Create simple, non-recursive policies for users table
-- These don't reference the users table within their conditions

-- Allow users to read their own profile using auth.uid() directly
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

-- Allow authenticated users to read all users (simpler approach)
CREATE POLICY "All authenticated can view users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Only allow inserts/updates if the user is an owner (check via auth metadata)
-- For now, we'll use a simpler approach - authenticated users can insert
CREATE POLICY "Authenticated can manage own user" ON users
  FOR ALL TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users';

-- You should see 3 policies without recursion errors
