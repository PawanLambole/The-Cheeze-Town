const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Deleting obsoleted versions (IDs: 4, 3)...');

    // Deleting "1.1.1" (id 4) and "TEST-UPDATE" (id 3)
    // Keeping 1.0.0 (baseline), 1.1.0 (previous native baseline), and 1.0.1 (current OTA)
    // Actually, user said "delete all another updates we want only current".
    // 1.0.0 is native, likely installed. 1.1.0 is native, ID 2.
    // I should probably keep native versions as they are baselines.
    // I will delete the OTA attempt 1.1.1 (ID 4) and TEST-UPDATE (ID 3).

    const { error } = await supabase
        .from('app_versions')
        .delete()
        .in('id', [4, 3]);

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log('Successfully deleted versions 3 and 4.');
    }
}

main();
