
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for testing to guarantee access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";
const SECRET = process.env.ORDER_NOTIFICATION_SECRET;

async function triggerNotification() {
    console.log('--- Triggering Manual Notification ---');

    if (!SECRET) {
        console.error('❌ Missing ORDER_NOTIFICATION_SECRET');
        return;
    }

    const functionUrl = `${SUPABASE_URL}/functions/v1/order-notification`;

    // Mimic the payload sent by the database trigger for a new order
    const payload = {
        eventType: 'ORDER_INSERT',
        record: {
            id: 'test-order-' + Date.now(),
            order_number: 999,
            table_id: 'Test Table',
            total_amount: 150.00,
            status: 'pending'
        }
    };

    console.log(`Target: ${functionUrl}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'x-order-notification-secret': SECRET
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const data = await response.json();

        console.log(`\nResponse Status: ${status}`);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (status === 200) {
            console.log('\n✅ Notification Request Sent Successfully!');
            console.log('👉 Check your device now.');
        } else {
            console.log('\n❌ Notification Request Failed.');
        }

    } catch (error) {
        console.error('\n❌ Request Error:', error.message);
    }
}

triggerNotification();
