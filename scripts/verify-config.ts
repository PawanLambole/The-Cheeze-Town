
import dotenv from 'dotenv';
// Load env (assuming running from root)
dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';
const LOCAL_SECRET = process.env.ORDER_NOTIFICATION_SECRET;

async function diagnose() {
    console.log('--- Diagnosing Notification Configuration (Final Check) ---');

    if (!LOCAL_SECRET) console.error('❌ ORDER_NOTIFICATION_SECRET missing in .env');
    else console.log('✅ ORDER_NOTIFICATION_SECRET present in .env');

    // 1. Verify Secret Match via RPC
    console.log('\nVerifying Secret via get_order_notification_secret()...');
    try {
        const funcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_order_notification_secret`;
        const funcResp = await fetch(funcUrl, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        if (funcResp.ok) {
            const remoteSecret = await funcResp.json();
            // remoteSecret should be the string
            if (remoteSecret === LOCAL_SECRET) {
                console.log('✅ SECRET MATCHES! Database and .env are in sync.');
            } else {
                console.error('❌ SECRET MISMATCH!');
                console.log(`   Remote (DB): ${remoteSecret ? remoteSecret.substring(0, 5) + '...' : 'null'}`);
                console.log(`   Local (.env): ${LOCAL_SECRET ? LOCAL_SECRET.substring(0, 5) + '...' : 'null'}`);
            }
        } else {
            console.error('❌ Failed to call secret RPC:', funcResp.status, await funcResp.text());
        }

    } catch (e: any) {
        console.log('Error checking secret:', e.message);
    }

    console.log('\n--- Diagnosis Complete ---');
}

diagnose();
