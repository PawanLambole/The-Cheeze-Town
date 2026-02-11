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
    const versionCode = Number.parseInt(process.env.EXPO_PUBLIC_APP_VERSION_CODE || '0', 10) || 1;

    console.log(`Inserting new OTA version ${versionName}...`);

    const newVersion = {
        version_name: versionName,
        version_code: versionCode,
        runtime_version: runtimeVersion,
        platform: 'all', // OTA addresses both platforms
        update_type: 'ota',
        is_mandatory: false,
        is_active: true,
        download_url: null,
        release_notes: "Fix expense calculations to include staff salaries and verify push notifications.",
        update_message: "A new update is available with expense reporting fixes.",
    };

    const { data, error } = await supabase
        .from('app_versions')
        .insert([newVersion])
        .select();

    if (error) {
        console.error('Error inserting version:', error);
    } else {
        console.log('Successfully inserted version:', data);

        // Also update app_config
        console.log('Updating app_config...');
        const { error: configError } = await supabase
            .from('app_config')
            .update({
                current_version_name: versionName,
                current_version_code: versionCode,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (configError) {
            console.error('Error updating app_config:', configError);
        } else {
            console.log('Successfully updated app_config.');
        }
    }
}

main();
