
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const fs = require('fs');

async function checkAuthLink() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    log('Fetching auth.users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        log('Error fetching auth users: ' + JSON.stringify(authError));
        fs.writeFileSync('debug_output.txt', output);
        return;
    }

    log(`Found ${authUsers.length} auth users.`);

    log('Fetching public.users...');
    const { data: publicUsers, error: dbError } = await supabase
        .from('users')
        .select('*');

    if (dbError) {
        log('Error fetching public users: ' + JSON.stringify(dbError));
        fs.writeFileSync('debug_output.txt', output);
        return;
    }

    log(`Found ${publicUsers.length} public users.`);

    log('\n--- MATCHING ---');

    authUsers.forEach(au => {
        const match = publicUsers.find(pu => pu.id === au.id);
        if (match) {
            log(`[OK] ${au.email} -> ${match.role} (ID: ${au.id})`);
        } else {
            log(`[MISSING LINK] Auth User ${au.email} (ID: ${au.id}) NOT FOUND in public.users with same ID.`);
            const emailMatch = publicUsers.find(pu => pu.email === au.email);
            if (emailMatch) {
                log(`    -> BUT found entry with same email via ID: ${emailMatch.id} (MISMATCH!!)`);
            }
        }
    });

    log('\n--- ORPHANS ---');
    publicUsers.forEach(pu => {
        if (!authUsers.find(au => au.id === pu.id)) {
            log(`[ORPHAN] Public User ${pu.email} (${pu.role}) ID: ${pu.id} not in Auth.`);
        }
    });

    fs.writeFileSync('debug_output.txt', output);
}

checkAuthLink();
