# 🔐 Authentication Setup Guide

## Quick Start

### Step 1: Run Auth Policies SQL
1. Open Supabase: https://hncahlshvismwagbcryi.supabase.co
2. Go to **SQL Editor** → **New Query**
3. Copy `auth-policies.sql` contents
4. Click **"Run"**

This sets up:
- ✅ Proper RLS policies
- ✅ Role-based access control
- ✅ Links users table to Supabase auth

### Step 2: Create Test Users

Go to Supabase → **Authentication** → **Users** → **Add User**

Create these accounts:

**Owner Account**:
- Email: `owner@cheezetown.com`
- Password: `owner123` (change later!)
- Auto Confirm: ✅ ON

**Manager Account**:
- Email: `manager@cheezetown.com`
- Password: `manager123`
- Auto Confirm: ✅ ON

**Chef Account**:
- Email: `chef@cheezetown.com`
- Password: `chef123`
- Auto Confirm: ✅ ON

### Step 3: Link Auth Users to Database

After creating each user in Step 2, run this for EACH user:

```sql
-- Get the auth user ID from Authentication > Users page
-- Replace 'AUTH_USER_ID_HERE' with actual UUID

-- For Owner
INSERT INTO users (auth_id, email, name, role, phone)
VALUES ('AUTH_USER_ID_HERE', 'owner@cheezetown.com', 'Restaurant Owner', 'owner', NULL);

-- For Manager  
INSERT INTO users (auth_id, email, name, role, phone)
VALUES ('AUTH_USER_ID_HERE', 'manager@cheezetown.com', 'Manager', 'manager', NULL);

-- For Chef
INSERT INTO users (auth_id, email, name, role, phone)
VALUES ('AUTH_USER_ID_HERE', 'chef@cheezetown.com', 'Head Chef', 'chef', NULL);
```

### Step 4: Test Login

1. **Restart your Expo app**
2. You'll see the login screen
3. Login with: `owner@cheezetown.com` / `owner123`
4. Should redirect to Owner Dashboard!

---

## What Each File Does

### `contexts/AuthContext.tsx`
- Manages authentication state
- Provides `useAuth()` hook
- Handles session persistence

### `services/auth.ts`
- Helper functions for auth operations
- Sign in/out, password reset, etc.

### `app/login.tsx`
- Login screen UI
- Email/password form
- Error handling

### `app/_layout.tsx` (Modified)
- Wraps app with AuthProvider
- Protects routes
- Auto-redirects based on role

### `auth-policies.sql`
- RLS policies for each table
- Role-based permissions
- Security rules

---

## How Authentication Works

```
User Opens App
    ↓
Check if authenticated
    ↓
   NO → Show Login Screen
    ↓
Enter email/password
    ↓
Supabase Auth validates
    ↓
   SUCCESS → Get user role from users table
    ↓
Redirect to role-specific dashboard:
  - owner → /owner
  - manager → /manager  
  - chef → /chef
  - waiter → /manager
```

---

## Role Permissions

### Owner
- ✅ Full access to everything
- ✅ Can manage users
- ✅ View all data

### Manager
- ✅ Manage orders, tables, staff
- ✅ View revenue & expenses
- ✅ Manage inventory
- ❌ Cannot manage users

### Chef
- ✅ View orders
- ✅ Update order status
- ❌ Cannot manage staff/finances

### Waiter
- ✅ Create/view orders
- ✅ Manage tables
- ❌ Cannot access finances

---

## Testing Checklist

After setup:

- [ ] Can login as owner
- [ ] Can login as manager
- [ ] Can login as chef
- [ ] Redirects to correct dashboard
- [ ] Can logout
- [ ] Session persists on app restart
- [ ] Cannot access data without login
- [ ] Chef can only see orders (not staff/finances)
- [ ] Manager cannot access owner features

---

## Troubleshooting

### "Error fetching user data"
- Check that auth_id in users table matches Supabase Auth user ID
- Verify users table has the user record

### "Invalid credentials"
- Ensure email/password are correct
- Check user was confirmed in Supabase Auth

### "Cannot read data"
- auth-policies.sql must be run
- RLS must be enabled
- User must be authenticated

### Stuck on login screen after successful login
- Check app/_layout.tsx for errors
- Verify userData.role is set correctly

---

## Security Notes

⚠️ **Test Credentials**
- Change passwords in production
- Use strong passwords
- Enable MFA for owners

⚠️ **RLS Policies**
- Always enabled in production
- Test with different roles
- Never disable RLS

✅ **Best Practices**
- Don't share credentials
- Logout when done
- Regular password updates

---

Your app is now secure with proper authentication! 🔐
