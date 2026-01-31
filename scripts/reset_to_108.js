
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function cleanAndResetVersions() {
    console.log('--- STARTING CLEAN SLATE PROTOCOL (1.0.8) ---');

    // 1. Deactivate ALL versions
    console.log('Deactivating ALL existing versions...');
    const { error: deactivateError } = await supabase
        .from('app_versions')
        .update({ is_active: false })
        .neq('id', 0); // Safety check, effectively all

    if (deactivateError) {
        console.error('Error deactivating versions:', deactivateError);
        return;
    }
    console.log('All versions deactivated.');

    // 2. Insert FRESH 1.0.8 Record (Active)
    // We use a slightly different release note to distinguish it
    console.log('Inserting fresh 1.0.8 record...');
    const { error: insertError } = await supabase
        .from('app_versions')
        .insert([
            {
                version_name: '1.0.8',
                version_code: 108,
                runtime_version: '1.0.0', // Must match app.config.js
                platform: 'all',
                update_type: 'ota',
                is_mandatory: true, // Force this one
                is_active: true,
                release_notes: 'Critical Update: Clean Reset to 1.0.8',
                update_message: 'Please update to version 1.0.8 immediately.'
            }
        ]);

    if (insertError) {
        console.error('Error inserting 1.0.8:', insertError);
        // Fallback: If 108 constraint exists, find and force-enable it
        // but "delete all previous" implies we really want this to be THE one.
        // If unique constraint fails, we update the existing 108.
        const { error: updateError } = await supabase
            .from('app_versions')
            .update({
                is_active: true,
                is_mandatory: true,
                release_notes: 'Critical Update: Clean Reset to 1.0.8 (Forced)',
                updated_at: new Date()
            })
            .eq('version_code', 108);

        if (updateError) console.error('Fallback update failed:', updateError);
        else console.log('Existing 1.0.8 record reactivated and enforced.');
    } else {
        console.log('Fresh 1.0.8 record created.');
    }

    // 3. Reset App Config
    console.log('Resetting App Configuration...');
    const { error: configError } = await supabase
        .from('app_config')
        .update({
            current_version_name: '1.0.8',
            current_version_code: 108,
            min_supported_version_code: 108, // Drag everyone up to 108
            force_update_enabled: true,
            updated_at: new Date()
        })
        .eq('id', 1);

    if (configError) console.error('Error resetting app_config:', configError);
    else console.log('App Config reset to force 1.0.8.');

    console.log('--- CLEAN SLATE COMPLETE ---');
}

cleanAndResetVersions();
