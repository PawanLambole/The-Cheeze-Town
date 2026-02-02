
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixOwner() {
    const userId = '1050e8e4-a606-494e-8ff1-a102818ae239'; // from debug output
    const email = 'pavanlambole578@gmail.com';

    console.log(`Fixing user ${email} (${userId})...`);

    const { data: existing } = await supabase.from('users').select('*').eq('id', userId).single();
    if (existing) {
        console.log('User already exists in public (unexpected per debug). Updating role to owner just in case.');
        const { error } = await supabase.from('users').update({ role: 'owner' }).eq('id', userId);
        if (error) console.error(error);
        else console.log('Updated.');
    } else {
        console.log('Inserting new owner record...');
        const { error } = await supabase.from('users').insert([{
            id: userId,
            email: email,
            name: 'Pavan Lambole',
            role: 'owner',
            is_active: true,
            created_at: new Date().toISOString()
        }]);
        if (error) {
            console.error('Error inserting:', error);
        } else {
            console.log('Successfully inserted owner record for ' + email);
        }
    }
}

fixOwner();
