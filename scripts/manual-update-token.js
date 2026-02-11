
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Role Key to bypass RLS
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function manualUpdate() {
    console.log('--- Manual Token Update Test ---');

    // 1. Get Chef ID
    const { data: chef, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'chef')
        .maybeSingle();

    if (userError || !chef) {
        console.error('❌ Error fetching chef:', userError?.message || 'Chef not found');
        return;
    }

    console.log(`Chef found: ${chef.name} (${chef.id})`);

    // 2. Update Token
    const testToken = 'ExponentPushToken[kYlJTNE26KxcBeoQ4a4zxq]';
    console.log(`Attempting to set token to: ${testToken}`);

    const { error: updateError } = await supabase
        .from('users')
        .update({ expo_push_token: testToken })
        .eq('id', chef.id);

    if (updateError) {
        console.error('❌ Update Failed:', updateError.message);
    } else {
        console.log('✅ Update Succeeded via Service Role');
    }
}

manualUpdate();
