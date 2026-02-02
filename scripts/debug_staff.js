
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
    console.log('Checking users table...');
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, name, status');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`- ${u.email} (${u.role}) [${u.status}] ID: ${u.id}`);
    });

    // Check for owner
    const owner = users.find(u => u.role === 'owner');
    if (owner) {
        console.log('\nOwner found:', owner.email);
    } else {
        console.log('\nNO OWNER FOUND in public.users!');
    }
}

checkUsers();
