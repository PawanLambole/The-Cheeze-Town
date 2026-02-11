
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for full access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Checking user_push_tokens Table ---');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    const { data, error } = await supabase.from('user_push_tokens').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} tokens:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
