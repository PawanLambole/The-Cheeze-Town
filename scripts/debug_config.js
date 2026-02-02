const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkConfig() {
    console.log('Checking app_config...');
    const { data: config, error } = await supabase.from('app_config').select('*');
    if (error) console.error('Error:', error);
    else console.log('App Config:', config);

    console.log('Checking app_versions...');
    const { data: versions, error: vError } = await supabase.from('app_versions').select('*');
    if (vError) console.error('Error:', vError);
    else console.log('App Versions:', versions);
}

checkConfig();
