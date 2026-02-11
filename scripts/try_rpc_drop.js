const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('--- SEARCHING FOR SQL EXECUTION FUNCTIONS ---');

    // Query information_schema for functions that might run SQL
    const { data, error } = await supabase
        .from('routines')
        .select('routine_name, routine_schema, data_type')
        .in('routine_schema', ['public', 'extensions'])
        .ilike('routine_name', '%exec%'); // Search for names like 'exec', 'execute', 'run_sql'

    // Since we can't easily query information_schema.routines directly via PostgREST with standard client sometimes due to permissions on system schema,
    // we might try a direct RPC call if we can guess the name, but listing is better.
    // Note: PostgREST usually exposes TABLES and VIEWS in the API, not system catalogs unless explicitly exposed.
    // Let's try to query a common known view if possible or just try to CALL the most common ones.

    const commonNames = ['exec_sql', 'run_sql', 'exec', 'execute_sql', 'query'];

    for (const name of commonNames) {
        console.log(`Checking RPC: ${name}...`);
        const { error } = await supabase.rpc(name, { sql: 'SELECT 1' });

        if (error) {
            console.log(`❌ ${name}: ${error.code} - ${error.message}`);
        } else {
            console.log(`✅ FOUND FUNCTION: ${name}`);
            // If found, let's try to use it to drop the table!
            await dropTable(name);
            return;
        }
    }

    console.log('No standard SQL execution functions found.');
}

async function dropTable(rpcName) {
    console.log(`Attempting to DROP table using ${rpcName}...`);
    const { error } = await supabase.rpc(rpcName, { sql: 'DROP TABLE IF EXISTS public.push_tokens' });
    if (error) {
        console.error('Drop failed:', error);
    } else {
        console.log('✅ TABLE DROPPED SUCCESSFULLY VIA RPC.');
    }
}

main();
