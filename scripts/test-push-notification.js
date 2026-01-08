const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendPush() {
    console.log('Fetching user with push token...');
    // Get user with a token
    const { data: users, error } = await supabase
        .from('users')
        .select('name, expo_push_token')
        .not('expo_push_token', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('❌ No users found with expo_push_token.');
        console.log('Please run the app, login, and ensure NotificationService registers the token.');
        return;
    }

    const user = users[0];
    const token = user.expo_push_token;
    console.log(`✅ Found user ${user.name || 'Unknown'} with token: ${token}`);

    // Send Push
    console.log('🚀 Sending push notification via Expo API...');
    const message = {
        to: token,
        sound: 'default',
        title: 'Background Notification Test 🔔',
        body: 'This notification works even if the app is killed!',
        data: { test: true },
        channelId: 'Orders_v4', // CRITICAL: Must match the channel created in the app
        priority: 'high',    // Ensure high priority for heads-up display
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        const result = await response.json();
        console.log('Push Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error sending push:', e);
    }
}

sendPush();
