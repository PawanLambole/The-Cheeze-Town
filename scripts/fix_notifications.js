const { createClient } = require('@supabase/supabase-js');

// Config from GEMINI.md
const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Using the Service Role Key from user_rules/GEMINI.md
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Starting Notification Preferences Backfill...');

    // 1. Fetch all users (from auth.users? No, can't access auth.users via client easily usually, but can access public.users)
    // Assuming 'public.users' is a mirror of auth.users or the main user table.
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, expo_push_token');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Found ${users.length} users.`);

    // 2. Prepare Preference Data
    const preferences = users.map(u => ({
        user_id: u.id,
        push_enabled: true,
        email_enabled: true,
        order_updates: true,
        promotions: false
    }));

    // 3. Upsert into notification_preferences
    // This requires the table to EXIST.
    const { data, error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert(preferences, { onConflict: 'user_id' })
        .select();

    if (upsertError) {
        console.error('Error upserting preferences:', upsertError);
        if (upsertError.code === '42P01') {
            console.error("CRITICAL: The table 'notification_preferences' DOES NOT EXIST.");
        }
    } else {
        console.log(`Successfully processed ${data ? data.length : 0} preferences records.`);
    }

    // 4. Check Tokens
    const usersWithToken = users.filter(u => u.expo_push_token);
    console.log(`Users with Push Tokens: ${usersWithToken.length}`);
}

main();
