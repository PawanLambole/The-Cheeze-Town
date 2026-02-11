
const https = require('https');

const PROJECT_REF = 'gnpdhisyxwqvnjleyola';
// Use the token from env or fallback
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_69b8b1f7c761307f9e101fbc7aa58a3960460310';

const sql = `
-- Allow users to update their own tokens (needed for upsert/last_used_at)
CREATE POLICY "Users can update their own tokens" 
ON public.user_push_tokens 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
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

console.log('--- Applying Fix: user_push_tokens UPDATE policy ---');
const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        // 201 Created or 200 OK usually
        if (responseBody) console.log('Response:', responseBody);
    });
});

req.on('error', (error) => console.error('Error:', error));
req.write(data);
req.end();
