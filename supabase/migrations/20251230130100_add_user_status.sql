-- Add status column to users table for approval workflow
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

-- Update existing users to have 'approved' status
UPDATE public.users 
SET status = 'approved' 
WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN public.users.status IS 'User approval status: pending, approved, inactive';
