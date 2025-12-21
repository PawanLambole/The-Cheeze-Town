# 🔧 Quick Fix for Infinite Recursion Error

## The Problem
You're seeing: `ERROR: infinite recursion detected in policy for relation "users"`

This happens because the RLS policies are checking the `users` table while trying to access the `users` table - creating a loop.

## The Solution

### Step 1: Run the Fix Script
1. Open Supabase: https://hncahlshvismwagbcryi.supabase.co
2. Go to **SQL Editor** → **New Query**
3. Copy entire contents of `fix-users-policy.sql`
4. Click **"Run"**

This will replace the problematic policies with simpler ones that don't cause recursion.

### Step 2: Restart Your App
1. Stop the Expo server (Ctrl+C in terminal)
2. Run: `npx expo start --tunnel`
3. Reload the app

## What Changed

**Before (❌ Causes Recursion)**:
```sql
-- This checks users table WHILE accessing users table
CREATE POLICY "Owners can view all" ON users
  USING (
    EXISTS (SELECT 1 FROM users WHERE role = 'owner')  -- ❌ Recursion!
  );
```

**After (✅ No Recursion)**:
```sql
-- This uses auth.uid() directly - no table lookup needed
CREATE POLICY "Users can view own profile" ON users
  USING (auth_id = auth.uid());  -- ✅ Direct check
```

## Test It
After running the fix:
1. App should load without errors
2. Try logging in with: `thecheesetown@gmail.com` / `cheese@1234`
3. Should redirect to Owner Dashboard

---

**Note**: I've also fixed the routing issue in the app - it now correctly navigates to `/login/index`.

Run `fix-users-policy.sql` and restart your app! 🚀
