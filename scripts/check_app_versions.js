
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAppVersions() {
    console.log('Checking app_versions table...');
    const { data: versions, error } = await supabase.from('app_versions').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching app versions:', error);
        return;
    }

    console.log(`Found ${versions.length} version records:`);
    console.log(JSON.stringify(versions, null, 2));
}

checkAppVersions();
