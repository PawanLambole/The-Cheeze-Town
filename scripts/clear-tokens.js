
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Role Key to bypass RLS
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function clearTokens() {
    console.log('--- Clearing Push Tokens ---');

    const { error } = await supabase
        .from('users')
        .update({ expo_push_token: null })
        .in('role', ['chef', 'manager', 'owner']);

    if (error) {
        console.error('❌ Error clearing tokens:', error.message);
    } else {
        console.log('✅ Tokens cleared for Chef, Manager, and Owner.');
    }
}

clearTokens();
