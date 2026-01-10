# Order Push Notifications (Works When App Is Closed)

In the chef app, the in-app “new order” banner + local notification is currently triggered by Supabase Realtime subscriptions. **Realtime only runs while the app process is alive**, so it will not reliably notify when the app is in the background or fully closed.

To get notifications **even when the app is closed**, you must use **server-side push notifications**:

1. Chef device registers an Expo Push Token and saves it to `public.users.expo_push_token`.
2. Postgres trigger fires on new `orders` / `order_items`.
3. Trigger calls the Supabase Edge Function `order-notification`.
4. Edge Function sends a push via Expo (`https://exp.host/--/api/v2/push/send`).

This repo already contains the pieces. The remaining requirement is configuration on your Supabase project.

## 1) Make sure chef tokens are stored

The app syncs the push token for chef users on login via `AuthContext`.

Verify in Supabase Table Editor:
- `public.users` has column `expo_push_token`
- Your chef user row has a non-null `expo_push_token`

If it’s null:
- Ensure notifications permission is granted on the device
- Open the chef app once and log in (token is collected on-device)

## 2) Configure the Edge Function secret

The Edge Function `supabase/functions/order-notification` requires a shared secret header `X-Order-Notification-Secret`.

You must set **both**:

### A) Edge Function environment variable

In Supabase Dashboard → Edge Functions → `order-notification` → Secrets:
- Set `ORDER_NOTIFICATION_SECRET` to a strong random secret

### B) Store the same secret in the database

A migration creates a private store + accessor:
- `app_private.secrets`
- `public.get_order_notification_secret()`

After applying migrations, run this in Supabase SQL Editor:

```sql
insert into app_private.secrets(key, value)
values ('order_notification_secret', '<SAME_SECRET_AS_EDGE_FUNCTION>')
on conflict (key) do update
set value = excluded.value, updated_at = now();
```

## 3) Ensure DB triggers are applied

These migrations define triggers that call the Edge Function:
- `supabase/migrations/20260109114500_private_notification_secret_store.sql`
- `supabase/migrations/20260109115000_secure_triggers_with_secret.sql`

Important: if the secret is not set in `app_private.secrets`, the trigger code intentionally does nothing (no HTTP call).

Apply your migrations to the Supabase project using your usual process (Supabase CLI or SQL Editor).

## 4) Android/iOS behavior notes

- Push notifications should arrive when the app is backgrounded or closed.
- If the user **force-stops** the app on some Android devices, notifications can be delayed or blocked until reopened (OS behavior).
- If you’re testing in **Expo Go**, push works for many cases but is not identical to a production build. For the most reliable behavior, test with an **EAS development build** or production build.

## 5) Quick test

There is a test script:
- `scripts/test-push-notification.js`

It calls the Edge Function directly. For the full end-to-end path, create a real order (insert into `public.orders`) and confirm that the DB trigger invokes the Edge Function and you receive a push.
