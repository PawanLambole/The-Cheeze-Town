# 🔐 Quick Setup Guide - Authentication

## Step 1: Run Database Policies

1. Open Supabase: https://hncahlshvismwagbcryi.supabase.co
2. Go to **SQL Editor** → **New Query**
3. Copy entire contents of `auth-policies.sql`
4. Click **"Run"**

✅ This sets up secure RLS policies.

---

## Step 2: Create Users in Supabase

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add User"** button (top right)

### Create User 1 - OWNER:
- Email: `thecheesetown@gmail.com`
- Password: `cheese@1234`
- Auto Confirm User: ✅ **Check this box!**
- Click **"Create User"**

### Create User 2 - MANAGER:
- Email: `manager@cheezetown.com`
- Password: `manager123`
- Auto Confirm User: ✅ **Check this box!**
- Click **"Create User"**

### Create User 3 - CHEF:
- Email: `chef@cheezetown.com`
- Password: `chef123`
- Auto Confirm User: ✅ **Check this box!**
- Click **"Create User"**

---

## Step 3: Get User IDs

Now you should see 3 users in the list. For EACH user:

1. Click on the user in the list
2. You'll see their details
3. **Copy the "ID" (UUID)** - it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
4. Paste it somewhere temporarily (notepad)

You should now have 3 UUIDs - one for each user.

---

## Step 4: Link Users to Database

1. Open `create-test-users.sql` file
2. Replace these 3 placeholders with your actual UUIDs:
   - Line 41: `REPLACE_WITH_OWNER_AUTH_ID` → paste owner's UUID
   - Line 55: `REPLACE_WITH_MANAGER_AUTH_ID` → paste manager's UUID
   - Line 69: `REPLACE_WITH_CHEF_AUTH_ID` → paste chef's UUID

3. Go back to Supabase → **SQL Editor** → **New Query**
4. Copy the ENTIRE updated `create-test-users.sql` file
5. Click **"Run"**

You should see: ✅ "3 rows returned" showing your 3 users.

---

## Step 5: Test Login!

1. **Restart your Expo app** (stop and run `npx expo start --tunnel` again)
2. You'll see the **login screen**
3. Login with:
   - Email: `thecheesetown@gmail.com`
   - Password: `cheese@1234`
4. Should redirect to **Owner Dashboard**! 🎉

---

## Quick Summary

```
✅ Run auth-policies.sql
↓
✅ Create 3 users in Supabase Auth
↓
✅ Copy their 3 UUIDs
↓
✅ Update create-test-users.sql with UUIDs
↓
✅ Run create-test-users.sql
↓
✅ Login to app!
```

---

## Where to Find Things

**Supabase Dashboard**: https://hncahlshvismwagbcryi.supabase.co

**Files**:
- `auth-policies.sql` - Run this FIRST
- `create-test-users.sql` - Update with UUIDs, then run

**Test Credentials**:
- Owner: `thecheesetown@gmail.com` / `cheese@1234`
- Manager: `manager@cheezetown.com` / `manager123`
- Chef: `chef@cheezetown.com` / `chef123`

---

That's it! Follow the steps in order and you'll have authentication working! 🚀
