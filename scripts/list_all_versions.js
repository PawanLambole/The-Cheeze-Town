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
    console.log('--- All App Versions ---');
    const { data: versions, error } = await supabase
        .from('app_versions')
        .select('id, version_name, version_code, runtime_version, update_type, created_at')
        .order('created_at', { ascending: false });

    if (error) console.error(error);
    else console.log(JSON.stringify(versions, null, 2));
}

main();
