
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ensureVersion108() {
    // 1. Check if 1.0.8 exists
    const { data: existing, error: fetchError } = await supabase
        .from('app_versions')
        .select('*')
        .eq('version_code', 108)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
        console.error('Error fetching version 108:', fetchError);
        return;
    }

    if (existing) {
        console.log('Version 1.0.8 exists. Updating metadata...');
        const { error: updateError } = await supabase
            .from('app_versions')
            .update({
                release_notes: 'Fix: Manager dashboard redirect and Add Item search (Updated Bundle)',
                update_message: 'Update 1.0.8: Critical fixes included.',
                is_active: true,
                updated_at: new Date()
            })
            .eq('version_code', 108);

        if (updateError) console.error('Error updating 1.0.8:', updateError);
        else console.log('Successfully updated 1.0.8 record.');

    } else {
        console.log('Version 1.0.8 does not exist. Inserting...');
        const { error: insertError } = await supabase
            .from('app_versions')
            .insert([
                {
                    version_name: '1.0.8',
                    version_code: 108,
                    runtime_version: '1.0.0', // Matches app.config.js
                    platform: 'all',
                    update_type: 'ota',
                    is_mandatory: false,
                    is_active: true,
                    release_notes: 'Fix: Manager dashboard redirect and Add Item search',
                    update_message: 'Update 1.0.8 available.'
                }
            ]);

        if (insertError) console.error('Error inserting 1.0.8:', insertError);
        else console.log('Successfully inserted 1.0.8.');
    }

    // 2. Update app_config to point to 108
    console.log('Updating app_config to 1.0.8...');
    const { error: configError } = await supabase
        .from('app_config')
        .update({
            current_version_name: '1.0.8',
            current_version_code: 108,
            updated_at: new Date()
        })
        .eq('id', 1);

    if (configError) {
        console.error('Error updating app_config:', configError);
    } else {
        console.log('Success: app_config is now 1.0.8');
    }
}

ensureVersion108();
