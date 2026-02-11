
const https = require('https');

const PROJECT_REF = 'gnpdhisyxwqvnjleyola';
// Use the token from env or fallback to the one provided in the context
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_69b8b1f7c761307f9e101fbc7aa58a3960460310';

const sql = `
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
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

console.log('--- Applying User RLS Fix ---');
console.log(`Target Project: ${PROJECT_REF}`);

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
