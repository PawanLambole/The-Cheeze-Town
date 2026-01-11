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
    console.log('--- App Config ---');
    const { data: config, error: cError } = await supabase
        .from('app_config')
        .select('*');

    if (cError) console.error(cError);
    else console.table(config);

    console.log('\n--- Recent App Versions (Top 3) ---');
    const { data: versions, error: vError } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (vError) console.error(vError);
    else console.log(JSON.stringify(versions, null, 2));
}

main();
