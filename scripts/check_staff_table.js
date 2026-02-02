
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkStaffTable() {
    console.log('Checking staff table...');
    const { data: staff, error } = await supabase.from('staff').select('*');

    if (error) {
        console.error('Error fetching staff:', error);
        return;
    }

    console.log(`Found ${staff.length} staff records.`);
    if (staff.length > 0) {
        console.log(staff);
    }
}

checkStaffTable();
