const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'gnpdhisyxwqvnjleyola';
const ACCESS_TOKEN = 'sbp_29177bf7e8887b9213ef628bc9acc7e3927a9a1a';

const sql = `
-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    push_enabled boolean DEFAULT true,
    email_enabled boolean DEFAULT true,
    order_updates boolean DEFAULT true,
    promotions boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
    CREATE POLICY "Users can view their own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
    CREATE POLICY "Users can update their own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
    CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 3. Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user_preferences() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.notification_preferences;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON public.users;
CREATE TRIGGER on_auth_user_created_preferences AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- 4. Backfill
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
`;

const data = JSON.stringify({ query: sql });

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', responseBody);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
