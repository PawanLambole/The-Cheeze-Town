
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for full access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

const VERSION_CODE = 113;
const VERSION_NAME = '1.0.13';
const UPDATE_MESSAGE = 'Fix: Version Loop Issue & Multi-Device Support';

console.log(`--- Publishing Version ${VERSION_NAME} (${VERSION_CODE}) ---`);
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function publish() {
    // 1. Insert/Update Version
    const { error: versionError } = await supabase
        .from('app_versions')
        .upsert({
            version_name: VERSION_NAME,
            version_code: VERSION_CODE,
            platform: 'android',
            update_type: 'native',
            is_mandatory: true,
            is_active: true,
            update_message: UPDATE_MESSAGE,
            release_notes: 'Fixed version code mismatch causing update loop.',
            updated_at: new Date().toISOString()
        }, { onConflict: 'version_code' });

    if (versionError) {
        console.error('❌ Error updating app_versions:', versionError);
        return;
    }
    console.log('✅ Version record inserted/updated.');

    // 2. Update App Config
    const { error: configError } = await supabase
        .from('app_config')
        .update({
            current_version_code: VERSION_CODE,
            current_version_name: VERSION_NAME,
            min_supported_version_code: VERSION_CODE,
            min_supported_version_name: VERSION_NAME,
            force_update_enabled: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1);

    if (configError) {
        console.error('❌ Error updating app_config:', configError);
    } else {
        console.log('✅ App Config updated to enforce version 112.');
    }
}

publish();
