const { createClient } = require('@supabase/supabase-js');

const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

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
