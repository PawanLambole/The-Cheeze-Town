-- =====================================================
-- CREATE TEST USERS
-- =====================================================
-- Run this AFTER creating users in Supabase Auth UI
-- Replace the auth_id UUIDs with the actual IDs from Auth dashboard
-- =====================================================

-- STEP 1: Go to Supabase → Authentication → Users
-- STEP 2: Create these users manually (click "Add User"):
--   
--   USER 1 - OWNER:
--   Email: thecheesetown@gmail.com
--   Password: cheese@1234
--   Auto Confirm User: ✅ ON
--
--   USER 2 - MANAGER:
--   Email: manager@cheezetown.com
--   Password: manager123
--   Auto Confirm User: ✅ ON
--
--   USER 3 - CHEF:
--   Email: chef@cheezetown.com  
--   Password: chef123
--   Auto Confirm User: ✅ ON
--
-- STEP 3: After creating each user, copy their UUID (auth ID) from the Auth dashboard
-- STEP 4: Replace 'REPLACE_WITH_OWNER_AUTH_ID' etc. below with actual UUIDs
-- STEP 5: Run this script

-- =====================================================
-- INSERT USERS INTO DATABASE
-- =====================================================

-- Owner User (thecheesetown@gmail.com)
INSERT INTO users (auth_id, email, name, role, phone, created_at)
VALUES (
  'be0a1fa4-ee11-4e4f-8be8-72068e4ed0cd'::uuid,
  'thecheesetown@gmail.com',
  'Restaurant Owner',
  'owner',
  '+91 98765 43210',
  NOW()
)
ON CONFLICT (auth_id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Manager User
INSERT INTO users (auth_id, email, name, role, phone, created_at)
VALUES (
  '88ce8bd0-4d3f-4e9d-958f-369c0d4f6249'::uuid,
  'manager@cheezetown.com',
  'Manager',
  'manager',
  '+91 98765 43211',
  NOW()
)
ON CONFLICT (auth_id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Chef User
INSERT INTO users (auth_id, email, name, role, phone, created_at)
VALUES (
  'f75a311c-2570-4c38-83da-6a6c64eb9195'::uuid,
  'chef@cheezetown.com',
  'Head Chef',
  'chef',
  '+91 98765 43212',
  NOW()
)
ON CONFLICT (auth_id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- =====================================================
-- VERIFY USERS WERE CREATED
-- =====================================================
SELECT id, auth_id, email, name, role 
FROM users 
WHERE email IN ('thecheesetown@gmail.com', 'manager@cheezetown.com', 'chef@cheezetown.com')
ORDER BY role;

-- You should see 3 rows:
-- 1. thecheesetown@gmail.com | Restaurant Owner | owner
-- 2. chef@cheezetown.com | Head Chef | chef  
-- 3. manager@cheezetown.com | Manager | manager
