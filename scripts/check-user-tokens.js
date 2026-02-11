
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkUserTokens() {
    console.log('--- Checking user_push_tokens ---');

    const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select(`
            token,
            last_used_at,
            users (name, role)
        `);

    if (error) {
        console.error('❌ Error fetching tokens:', error);
        return;
    }

    if (!tokens) {
        console.log('⚠️ No data returned (tokens is null)');
        return;
    }

    console.log(`Found ${tokens.length} tokens:`);
    tokens.forEach(t => {
        const user = Array.isArray(t.users) ? t.users[0] : t.users;
        console.log(`- ${user?.name} (${user?.role}): ${t.token} (Last used: ${t.last_used_at})`);
    });
}

checkUserTokens();
