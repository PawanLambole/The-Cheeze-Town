const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Cleaning up versions > 1.0.9 (code 109)...');

    // 1. Delete versions > 109
    const { data: deleted, error: deleteError } = await supabase
        .from('app_versions')
        .delete()
        .gt('version_code', 109)
        .select();

    if (deleteError) {
        console.error('Error deleting versions:', deleteError);
    } else {
        console.log(`Deleted ${deleted.length} versions > 109:`, deleted.map(v => `${v.version_name} (${v.version_code})`));
    }

    // 2. Ensure 1.0.9 exists and is active
    const { data: v109, error: checkError } = await supabase
        .from('app_versions')
        .select('*')
        .eq('version_code', 109)
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error checking for version 1.0.9:', checkError);
    }

    if (!v109) {
        console.log('Version 1.0.9 not found. Inserting...');
        const newVersion = {
            version_name: '1.0.9',
            version_code: 109,
            runtime_version: '1.0.9',
            platform: 'all',
            update_type: 'ota',
            is_mandatory: false,
            is_active: true,
            download_url: null,
            release_notes: "Standardized to 1.0.9",
            update_message: "Update to 1.0.9",
        };
        const { error: insertError } = await supabase.from('app_versions').insert([newVersion]);
        if (insertError) console.error('Error inserting 1.0.9:', insertError);
        else console.log('Inserted 1.0.9.');
    } else {
        console.log('Version 1.0.9 exists.');
    }

    // 3. Update app_config to point to 1.0.9
    console.log('Updating app_config to 1.0.9...');
    const { error: configError } = await supabase
        .from('app_config')
        .update({
            current_version_name: '1.0.9',
            current_version_code: 109,
            updated_at: new Date().toISOString()
        })
        .gte('id', 0); // Update all configs just in case, or usually checking ID 1

    if (configError) {
        console.error('Error updating app_config:', configError);
    } else {
        console.log('Updated app_config to 1.0.9.');
    }
}

main();
