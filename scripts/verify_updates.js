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

async function checkUpdateLogic() {
    // Simulate App Version 1.0.0 trying to update to 1.0.9
    const simulatedCurrentCode = 100;
    const platform = 'android';

    console.log(`Checking for updates (Current Code: ${simulatedCurrentCode})...`);

    const { data, error } = await supabase.rpc('check_update_required', {
        p_current_version_code: simulatedCurrentCode,
        p_platform: platform,
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('Update Check Result:', data);
    }
}

checkUpdateLogic();
