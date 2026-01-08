-- Add expo_push_token column to users table
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS expo_push_token text;
