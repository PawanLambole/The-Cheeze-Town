-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    push_enabled boolean DEFAULT true,
    email_enabled boolean DEFAULT true,
    order_updates boolean DEFAULT true,
    promotions boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.notification_preferences;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new users (ensure this runs after user creation)
-- Checking if trigger already exists on users table, if not create it
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON public.users;
CREATE TRIGGER on_auth_user_created_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_preferences();

-- BACKFILL EXISTING USERS
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
