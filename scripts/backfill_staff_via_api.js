
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function backfillStaff() {
    console.log('Fetching eligible users...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['manager', 'chef', 'waiter', 'cashier']);

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`Found ${users.length} eligible staff users.`);

    for (const user of users) {
        console.log(`Processing ${user.name} (${user.role})...`);
        const { error: upsertError } = await supabase
            .from('staff')
            .upsert({
                user_id: user.id,
                position: user.role,
                status: 'active',
                created_at: user.created_at,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error(`Failed to upsert staff for ${user.email}:`, upsertError);
        } else {
            console.log(`Success.`);
        }
    }
    console.log('Backfill complete.');
}

backfillStaff();
