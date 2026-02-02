const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Using Service Role Key from user rules
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';
const NOTIFICATION_SECRET = process.env.ORDER_NOTIFICATION_SECRET || 'q7CMSbqR0Uebb8mlQnR/T44j/b+GpVs2xNGa5rlQo1H3zuZKWuPLW/sqdtrrnYzP';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-notification`;

async function testDirectEdgeFunction() {
    console.log('🚀 Testing Edge Function Directly (Attempt 3 - Service Role Key)...');
    console.log(`target: ${FUNCTION_URL}`);

    const payload = {
        eventType: 'ORDER_INSERT',
        record: {
            id: 999999,
            order_number: 'TEST-DIRECT-3',
            table_id: 99,
            total_amount: 99.99,
            status: 'pending'
        }
    };

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`, // Using Service Role Key
                'X-Order-Notification-Secret': NOTIFICATION_SECRET
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log(`\nStatus: ${response.status}`);
        console.log('Response:', text);

        if (response.ok) {
            console.log('\n✅ Edge Function accepted the request.');
        } else {
            console.error('\n❌ Edge Function rejected the request.');
        }

    } catch (e) {
        console.error('Request failed:', e);
    }
}

testDirectEdgeFunction();
