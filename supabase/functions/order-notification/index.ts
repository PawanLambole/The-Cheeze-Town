// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { record } = await req.json();

        if (!record || !record.id) {
            // Just a ping or invalid data
            return new Response(JSON.stringify({ message: "No record data" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        console.log(`🔔 Processing order: ${record.id}`);

        // 1. Fetch Users wanting notifications (Chefs usually, specifically with Role logic if needed, but for now ANYONE with a token)
        const { data: users, error: userError } = await supabaseClient
            .from('users')
            .select('expo_push_token')
            .not('expo_push_token', 'is', null);

        if (userError) {
            throw new Error(`Error fetching users: ${userError.message}`);
        }

        if (!users || users.length === 0) {
            console.log('No users with push tokens found.');
            return new Response(JSON.stringify({ message: "No users to notify" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. Prepare Notifications
        const messages = users.map((user: any) => {
            if (!user.expo_push_token) return null;
            return {
                to: user.expo_push_token,
                sound: 'default',
                title: `New Order #${record.order_number || record.id} 🍔`,
                body: `Table ${record.table_id || 'N/A'} - ₹${record.total_amount}`,
                data: { orderId: record.id }, // MATCHES CLIENT LISTENER EXPECTATION
                channelId: 'Orders_v4',      // MATCHES CLIENT CHANNEL
                priority: 'high',            // MAX PRIORITY
            };
        }).filter(Boolean);

        // 3. Send to Expo
        const chunks = [];
        while (messages.length > 0) {
            chunks.push(messages.splice(0, 100));
        }

        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            });
            const result = await response.json();
            console.log('Expo Response:', JSON.stringify(result));
        }

        return new Response(JSON.stringify({ message: "Notifications sent!" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
