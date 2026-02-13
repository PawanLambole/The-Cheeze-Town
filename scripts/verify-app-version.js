
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for full access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Verifying App Configuration ---');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verify() {
    // 1. Check App Config
    const { data: config, error: configError } = await supabase
        .from('app_config')
        .select('*')
        .single();

    if (configError) console.error('❌ Config Error:', configError);
    else {
        console.log('✅ App Config:');
        console.log(`- Current Version: ${config.current_version_name} (${config.current_version_code})`);
        console.log(`- Min Supported:   ${config.min_supported_version_name} (${config.min_supported_version_code})`);
        console.log(`- Force Update:    ${config.force_update_enabled}`);
    }

    // 2. Check Latest Version Record
    const { data: versions, error: versionError } = await supabase
        .from('app_versions')
        .select('*')
        .eq('version_code', 111);

    if (versionError) console.error('❌ Version Error:', versionError);
    else {
        console.log(`\n✅ Version 111 Record (${versions.length} found):`);
        versions.forEach(v => {
            console.log(`- Active: ${v.is_active}, Mandatory: ${v.is_mandatory}, Type: ${v.update_type}`);
        });
    }
}

verify();
