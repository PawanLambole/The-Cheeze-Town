const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkVersion() {
    console.log('Checking Supabase Versions...');

    // 1. Check app_config
    const { data: config, error: configError } = await supabase
        .from('app_config')
        .select('*')
        .single();

    if (configError) console.error('Error fetching app_config:', configError);
    else console.log('Current Config:', config);

    // 2. Check recent app_versions
    const { data: versions, error: versionsError } = await supabase
        .from('app_versions')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(3);

    if (versionsError) console.error('Error fetching app_versions:', versionsError);
    else {
        console.log('Recent Versions:');
        versions.forEach(v => console.log(`- ${v.version_name} (${v.version_code}) [${v.update_type}] active=${v.is_active}`));
    }
}

checkVersion();
