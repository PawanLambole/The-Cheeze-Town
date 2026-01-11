const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Running update to fix runtime_version...');

    // Explicitly update ID 5 or version_code 101 to runtime '1.0.0'
    const { data, error } = await supabase
        .from('app_versions')
        .update({ runtime_version: '1.0.0' })
        .eq('version_code', 101)
        .select();

    if (error) {
        console.error('Error updating:', error);
    } else {
        console.log('Update success:', data);
    }
}

main();
