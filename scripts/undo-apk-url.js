
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Undoing Version 111 URL (Setting to NULL) ---');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function undo() {
    const { error } = await supabase
        .from('app_versions')
        .update({ download_url: null })
        .eq('version_code', 111);

    if (error) {
        console.error('❌ Error undoing URL:', error);
    } else {
        console.log('✅ Download URL reverted to NULL.');
    }
}

undo();
