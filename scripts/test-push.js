const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

if (!SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_KEY is required.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testPush() {
    console.log('🚀 Starting Push Notification Test...');

    // 1. Check for users with tokens
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, role, expo_push_token')
        .in('role', ['manager', 'owner', 'chef'])
        .not('expo_push_token', 'is', null);

    if (userError) {
        console.error('❌ Error fetching users:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.warn('⚠️ No users found with push tokens! Please open the app and log in as Manager/Owner to sync token.');
        return;
    }

    console.log(`✅ Found ${users.length} users with push tokens:`);
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`));

    // 2. Get a valid table_id
    const { data: table, error: tableError } = await supabase
        .from('restaurant_tables') // Correct table name
        .select('id')
        .limit(1)
        .maybeSingle();

    if (tableError || !table) {
        console.error('❌ Error fetching a valid table:', tableError);
        return;
    }
    const validTableId = table.id;
    console.log(`ℹ️ Using valid table_id: ${validTableId}`);


    // 3. Insert Test Order
    const orderNum = `TEST-${Math.floor(Math.random() * 1000)}`;
    console.log(`\n📦 Inserting test order: ${orderNum}...`);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            order_number: orderNum,
            table_id: validTableId,
            status: 'pending',
            total_amount: 100.00,
            notes: 'This is a test notification'
        })
        .select()
        .single();

    if (orderError) {
        console.error('❌ Failed to insert test order:', orderError);
        return;
    }

    console.log('✅ Test order inserted successfully!');
    console.log('⏳ Notification should arrive on your device shortly.');
    console.log(`   Order ID: ${order.id}`);

    // Optionally clean up
    // await supabase.from('orders').delete().eq('id', order.id);
}

testPush();
