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

async function main() {
    const versionName = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';

    // Calculate version code: 1.0.1 -> 101
    const parts = versionName.split('.').map(Number);
    if (parts.length !== 3) {
        console.error('Invalid version format. Expected x.y.z');
        process.exit(1);
    }
    const versionCode = parts[0] * 100 + parts[1] * 10 + parts[2];

    console.log(`Publishing OTA Version: ${versionName} (Code: ${versionCode})`);

    // 1. Insert into app_versions
    const newVersion = {
        version_name: versionName,
        version_code: versionCode,
        runtime_version: versionName, // Matching app version for OTA
        platform: 'all', // OTA applies to all usually
        update_type: 'ota',
        is_mandatory: false,
        is_active: true,
        download_url: null,
        release_notes: "Fix: Add validation for menu ingredient quantity",
        update_message: "A new update is available with bug fixes.",
    };

    const { data: vData, error: vError } = await supabase
        .from('app_versions')
        .insert([newVersion])
        .select();

    if (vError) {
        console.error('Error inserting app_versions:', vError);
        process.exit(1);
    }
    console.log('Inserted app_versions:', vData);

    // 2. Update app_config
    const { data: cData, error: cError } = await supabase
        .from('app_config')
        .update({
            current_version_name: versionName,
            current_version_code: versionCode,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select();

    if (cError) {
        console.error('Error updating app_config:', cError);
        process.exit(1);
    }
    console.log('Updated app_config:', cData);
}

main();
