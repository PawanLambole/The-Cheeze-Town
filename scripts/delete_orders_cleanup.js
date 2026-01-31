const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function run() {
    const targets = ['web28', 'ord650613', 'web58', 'web59'].map(t => t.toLowerCase());
    console.log(`Searching for targets (lowercase): ${targets.join(', ')}`);

    // Fetch last 100 orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, status')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Fetched ${orders.length} recent orders.`);

    // Find matches manually (case insensitive)
    const toDelete = orders.filter(o =>
        o.order_number && targets.includes(String(o.order_number).toLowerCase())
    );

    console.log('Matches found:', toDelete.map(o => `${o.order_number} (ID: ${o.id})`));

    if (toDelete.length === 0) {
        console.log('Sample of recent order numbers:', orders.slice(0, 5).map(o => o.order_number).join(', '));
        return;
    }

    const ids = toDelete.map(o => o.id);

    // Execute Delete
    // 1. Delete order_items (assuming cascade is missing, safe to try)
    const { error: itemError } = await supabase.from('order_items').delete().in('order_id', ids);
    if (itemError) console.error('Error deleting items:', itemError);

    // 2. Delete payments
    const { error: payError } = await supabase.from('payments').delete().in('order_id', ids);
    if (payError) console.error('Error deleting payments:', payError);

    // 3. Delete orders
    const { error: ordError } = await supabase.from('orders').delete().in('id', ids);

    if (ordError) {
        console.error('Error deleting orders:', ordError);
    } else {
        console.log('Successfully deleted orders:', ids.length);
    }
}

run();
