const { createClient } = require('@supabase/supabase-js');

const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY for this script.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    const versionName = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
    const runtimeVersion = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
    const versionCode = Number.parseInt(process.env.EXPO_PUBLIC_ANDROID_VERSION_CODE || '0', 10) || 1;

    console.log(`Inserting new OTA version ${versionName}...`);

    const newVersion = {
        version_name: versionName,
        version_code: versionCode,
        runtime_version: runtimeVersion,
        platform: 'android',
        update_type: 'ota',
        is_mandatory: false,
        is_active: true,
        download_url: null,
        release_notes: "Menu translation, UI fixes, and Logo update",
        update_message: "New features and improvements available.",
    };

    const { data, error } = await supabase
        .from('app_versions')
        .insert([newVersion])
        .select();

    if (error) {
        console.error('Error inserting version:', error);
    } else {
        console.log('Successfully inserted version:', data);
    }
}

main();
