# 🔓 Fixing Database Access Issue

## Problem
Your app can't read data because Supabase **Row Level Security (RLS)** is blocking anonymous access.

## Quick Fix (For Testing)

### Step 1: Run the Fix Script
1. Open Supabase Dashboard: https://hncahlshvismwagbcryi.supabase.co
2. Go to **SQL Editor** → **New Query**
3. Copy contents of **`fix-rls-policies.sql`**
4. Click **"Run"**

This temporarily allows your app to read/write data without authentication.

### Step 2: Test Your App
1. Restart your Expo app (or refresh)
2. Navigate to Chef Dashboard
3. Navigate to Manager → Tables
4. You should now see data!

---

## What This Does

The script updates RLS policies from:
```sql
-- Before (blocks anonymous users)
CREATE POLICY "Allow authenticated users to read orders" 
ON orders FOR SELECT TO authenticated USING (true);
```

To:
```sql
-- After (allows everyone)
CREATE POLICY "Allow all on orders" 
ON orders FOR ALL USING (true) WITH CHECK (true);
```

---

## ⚠️ Important Notes

### This is for TESTING ONLY!

For production, you should:
1. ✅ Implement proper authentication
2. ✅ Use restrictive RLS policies
3. ✅ Protect sensitive data

### Current State:
- ❌ No authentication required
- ❌ Anyone can read/write all data
- ✅ Good for development/testing
- ❌ NOT safe for production

---

## Alternative: Disable RLS Completely (Nuclear Option)

If the above doesn't work, you can temporarily disable RLS:

```sql
-- Disable RLS on all tables
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## Future: Implementing Authentication

When you're ready for production, you'll want to:

### 1. Add Supabase Auth to Your App

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'manager@example.com',
  password: 'password123',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### 2. Restore Proper RLS Policies

```sql
-- Only authenticated users can modify data
CREATE POLICY "Authenticated users can insert orders" 
ON orders FOR INSERT TO authenticated 
WITH CHECK (true);

-- Users can only see their own data
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT TO authenticated 
USING (auth.uid() = customer_id);
```

### 3. Add Role-Based Access

```sql
-- Only managers and owners can delete orders
CREATE POLICY "Only managers can delete" 
ON orders FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'owner')
  )
);
```

---

## Testing Checklist

After running `fix-rls-policies.sql`:

- [ ] Chef Dashboard shows orders
- [ ] Manager Tables shows restaurant tables
- [ ] Can create new orders
- [ ] Can update order status
- [ ] Can add new tables
- [ ] Can mark orders as ready/served
- [ ] Can process payments

---

## Summary

**Run `fix-rls-policies.sql` now** → Your app will immediately start working with database data!

The authentication can be added later when you're ready for production. For now, focus on testing that all the database integrations work correctly.
