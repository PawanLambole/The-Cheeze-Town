const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceKey);

async function registerUpdate() {
    const version = process.env.EXPO_PUBLIC_APP_VERSION;
    const versionCode = parseInt(process.env.EXPO_PUBLIC_APP_VERSION_CODE);

    if (!version || !versionCode) {
        console.error('Missing version info in .env');
        return;
    }

    console.log(`Registering update: ${version} (${versionCode})`);

    // 1. App Version
    const { error: versionError } = await supabase.from('app_versions').insert({
        version_name: version,
        version_code: versionCode,
        runtime_version: version,
        platform: 'all',
        update_type: 'ota',
        is_active: true,
        is_mandatory: false,
        release_notes: 'Login UI Refinements',
        update_message: 'Refined Login UI with compact sizing and no shadows.'
    });

    if (versionError) {
        console.error('Error inserting app_version:', versionError);
        // Don't return, try to update config anyway if it failed (maybe unique constraint etc)
    } else {
        console.log('Inserted into app_versions.');
    }

    // 2. App Config
    const { error: configError } = await supabase.from('app_config').update({
        current_version_name: version,
        current_version_code: versionCode,
        updated_at: new Date()
    }).eq('id', 1);

    if (configError) {
        console.error('Error updating app_config:', configError);
    } else {
        console.log('Successfully updated app_config in Supabase!');
    }
}

registerUpdate();
