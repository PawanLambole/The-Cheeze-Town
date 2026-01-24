const { createClient } = require('@supabase/supabase-js');

// Hardcoded for this script to match User Rules context
const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyDashboard() {
    console.log('--- Verifying Dashboard Metrics ---');

    const now = new Date();
    // We need to match the app's local time logic. The app runs on the device, using local time.
    // The script runs on the machine (Windows), also using local time.

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    // Use today's date for end of day as well
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    console.log(`Local Time: ${now.toString()}`);
    console.log(`Filter Range (ISO): ${startOfDay} to ${endOfDay}`);

    // 1. Fetch Orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayISO);

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');
    console.log(`Total Orders Created >= TodayISO: ${orders.length} (Valid: ${validOrders.length})`);

    // 2. Fetch Payments
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .gte('payment_date', startOfDay)
        .lte('payment_date', endOfDay);

    if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
    }

    console.log(`Total Payments in Range: ${payments.length}`);

    let onlineRev = 0;
    let cashRev = 0;
    const paidOrderIds = new Set();

    // Calculate from payments
    console.log('\n--- Calculation from Payments Table ---');
    payments.forEach(p => {
        const amt = Number(p.amount) || 0;
        const method = p.payment_method ? p.payment_method.toLowerCase() : '';
        console.log(`[PAYMENT] ID: ${p.id}, Order: ${p.order_id}, Method: '${p.payment_method}', Amount: ${amt}, Status: ${p.status}`);

        if (method === 'cash') {
            cashRev += amt;
        } else {
            onlineRev += amt;
        }
        if (p.order_id) paidOrderIds.add(p.order_id);
    });

    console.log(`Subtotal (Payments) -> Cash: ${cashRev}, Online: ${onlineRev}`);

    // Fallback from Orders
    console.log('\n--- Fallback from Orders Table ---');
    let fallbackCash = 0;
    let fallbackOnline = 0;

    validOrders.forEach(o => {
        const amt = Number(o.total_amount) || 0;
        console.log(`[ORDER] ID: ${o.id}, Num: ${o.order_number}, Status: '${o.status}', Amt: ${amt}, InPayments: ${paidOrderIds.has(o.id)}`);

        if (!paidOrderIds.has(o.id)) {
            if (o.status === 'paid') {
                console.log(`   -> Adding to Online (Fallback)`);
                fallbackOnline += amt;
            } else if (o.status === 'completed') {
                console.log(`   -> Adding to Cash (Fallback)`);
                fallbackCash += amt;
            } else {
                console.log(`   -> IGNORED (Status not paid/completed)`);
            }
        } else {
            console.log(`   -> Covered by Payments Table`);
        }
    });

    const totalCash = cashRev + fallbackCash;
    const totalOnline = onlineRev + fallbackOnline;
    const totalRevenue = totalCash + totalOnline;

    console.log('\n======= Final Dashboard Metrics =======');
    console.log(`Today's Cash Collection:   ₹${totalCash.toFixed(2)}`);
    console.log(`Today's Online Collection: ₹${totalOnline.toFixed(2)}`);
    console.log(`Today's Total Revenue:     ₹${totalRevenue.toFixed(2)}`);
    console.log('=======================================');
}

verifyDashboard();
