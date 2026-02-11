
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// ORDER_NOTIFICATION_SECRET is required to pass the EF security check
const SECRET = process.env.ORDER_NOTIFICATION_SECRET;

async function verifyEdgeFunction() {
    console.log('--- Verifying Edge Function Access ---');

    if (!SECRET) {
        console.error('❌ Missing ORDER_NOTIFICATION_SECRET in .env');
        return;
    }

    const functionUrl = `${SUPABASE_URL}/functions/v1/order-notification`;
    console.log(`Target: ${functionUrl}`);
    console.log(`Secret (first 5): ${SECRET.substring(0, 5)}...`);
    console.log(`Secret Length: ${SECRET.length}`);

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-order-notification-secret': SECRET
            },
            body: JSON.stringify({ test: true })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${text}`);

        if (status === 200) {
            console.log('✅ Edge Function Accepted Secret');
        } else {
            console.log('❌ Edge Function Rejected Secret');
        }

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
    }
    console.log('--- Verification Complete ---');
}

verifyEdgeFunction();
