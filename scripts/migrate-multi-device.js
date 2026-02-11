
const https = require('https');

const PROJECT_REF = 'gnpdhisyxwqvnjleyola';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_69b8b1f7c761307f9e101fbc7aa58a3960460310';

const sql = `
-- Create the table for multiple tokens per user
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token text NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if re-running
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can select their own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Admins can manage all tokens" ON public.user_push_tokens;

-- Policies
CREATE POLICY "Users can insert their own tokens" 
ON public.user_push_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own tokens" 
ON public.user_push_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.user_push_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins (Owner/Manager) might need to see tokens? Maybe not, but let's allow it for debugging
CREATE POLICY "Admins can manage all tokens"
ON public.user_push_tokens
FOR ALL
USING (
  exists (
    select 1 from public.users 
    where users.id = auth.uid() 
    and users.role in ('owner', 'manager')
  )
);
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

console.log('--- Applying Migration: user_push_tokens ---');
const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            // If successful, body might be empty or JSON
            if (responseBody) console.log('Response:', responseBody);
        } catch (e) {
            console.log('Raw Response:', responseBody);
        }
    });
});

req.on('error', (error) => console.error('Error:', error));
req.write(data);
req.end();
