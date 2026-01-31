
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function publishVersion109() {
    console.log('Publishing Version 1.0.9 to Supabase...');

    // 1. Insert into app_versions
    const { error: insertError } = await supabase
        .from('app_versions')
        .insert([
            {
                version_name: '1.0.9',
                version_code: 109,
                runtime_version: '1.0.0',
                platform: 'all',
                update_type: 'ota',
                is_mandatory: false,
                is_active: true,
                release_notes: 'Performance improvements and bug fixes.',
                update_message: 'Update 1.0.9 available.'
            }
        ]);

    if (insertError) {
        console.error('Error inserting 1.0.9 (might already exist):', insertError.message);
        // If it exists, update it to be active
        const { error: updateError } = await supabase
            .from('app_versions')
            .update({
                is_active: true,
                updated_at: new Date()
            })
            .eq('version_code', 109);
        if (updateError) console.error('Error updating existing 1.0.9:', updateError);
    } else {
        console.log('Successfully inserted version 1.0.9');
    }

    // 2. Update app_config to point to 109
    const { error: configError } = await supabase
        .from('app_config')
        .update({
            current_version_name: '1.0.9',
            current_version_code: 109,
            updated_at: new Date()
        })
        .eq('id', 1);

    if (configError) {
        console.error('Error updating app_config:', configError);
    } else {
        console.log('Success: app_config is now 1.0.9');
    }
}

publishVersion109();
