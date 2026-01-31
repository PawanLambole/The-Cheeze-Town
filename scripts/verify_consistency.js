
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkVersions() {
    console.log('--- Checking Supabase Versions ---');

    // 1. Check app_config (Single Source of Truth for "Current Version")
    const { data: config, error: configError } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', 1)
        .single();

    if (configError) console.error('Error fetching app_config:', configError);
    else {
        console.log('App Config (Current Goal):');
        console.log(`  Version Name: ${config.current_version_name}`);
        console.log(`  Version Code: ${config.current_version_code}`);
    }

    // 2. Check app_versions (History / Metadata)
    const { data: versions, error: versionsError } = await supabase
        .from('app_versions')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(3);

    if (versionsError) console.error('Error fetching app_versions:', versionsError);
    else {
        console.log('Recent App Versions (Metadata):');
        versions.forEach(v => {
            console.log(`  [${v.version_code}] ${v.version_name} (${v.update_type}) - Active: ${v.is_active}`);
        });
    }
}

checkVersions();
