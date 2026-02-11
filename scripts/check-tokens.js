
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Role Key to bypass RLS and see all users
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTokens() {
    console.log('--- Checking Push Tokens ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, role, expo_push_token');

    if (error) {
        console.error('❌ Error fetching users:', error.message);
        return;
    }

    console.log(`\nFound ${users.length} users in 'users' table:`);
    users.forEach(u => {
        console.log(`- ${u.name} (${u.role}): ${u.expo_push_token}`);
    });

    console.log('\n--- Checking RLS Policies ---');
    const { data: policies, error: polError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'users');

    // pg_policies is a system view, accessible via service role usually? 
    // Wait, accessing pg_catalog via PostgREST might be restricted.
    // Instead use RPC if possible or just rely on CLI.

    // CLI is better for system tables.
}

checkTokens();
