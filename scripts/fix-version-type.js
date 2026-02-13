
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Fixing Version 111 Type ---');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fix() {
    const { error } = await supabase
        .from('app_versions')
        .update({ update_type: 'native' })
        .eq('version_code', 111);

    if (error) console.error('❌ Error fixing version:', error);
    else console.log('✅ Version 111 update_type set to "native"');
}

fix();
