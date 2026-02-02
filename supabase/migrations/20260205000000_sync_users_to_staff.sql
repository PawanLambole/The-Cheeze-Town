-- Function to automatically create staff record when a user with staff role is created
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user has a staff role
  IF NEW.role IN ('manager', 'chef', 'waiter', 'cashier') THEN
    INSERT INTO public.staff (
      user_id,
      position,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.role,        -- Map role to position initially
      'active',        -- Default status
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        position = EXCLUDED.position,
        updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert or update of users table
DROP TRIGGER IF EXISTS on_auth_user_created_for_staff ON public.users;
CREATE TRIGGER on_auth_user_created_for_staff
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_staff_user();

-- BACKFILL: Insert existing users into staff table
INSERT INTO public.staff (user_id, position, status, created_at, updated_at)
SELECT 
    id, 
    role, 
    'active', 
    created_at, 
    updated_at
FROM public.users
WHERE role IN ('manager', 'chef', 'waiter', 'cashier')
ON CONFLICT (user_id) DO NOTHING;
