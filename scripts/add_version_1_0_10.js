
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function pushNewVersion() {
    console.log('Inserting new version 1.0.10...');
    const { error } = await supabase.from('app_versions').insert([{
        version_name: '1.0.10',
        version_code: 110,
        runtime_version: '1.0.0',
        platform: 'all',
        update_type: 'ota',
        is_mandatory: false,
        is_active: true,
        release_notes: "v1.0.10: UPI payment and Staff Fixes",
        update_message: "New update available.",
        created_at: new Date().toISOString()
    }]);

    if (error) {
        console.error('Error inserting version:', error);
    } else {
        console.log('Successfully added version 1.0.10 to app_versions.');
    }
}

pushNewVersion();
