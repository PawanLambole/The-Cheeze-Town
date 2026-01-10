// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    // Include custom auth header so browser-based testing doesn't fail preflight.
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-order-notification-secret',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const expectedSecret = Deno.env.get('ORDER_NOTIFICATION_SECRET') ?? '';
        const providedSecret = req.headers.get('x-order-notification-secret') ?? '';

        if (!expectedSecret || providedSecret !== expectedSecret) {
            console.warn('Unauthorized order-notification request', {
                hasExpectedSecret: Boolean(expectedSecret),
                hasProvidedSecret: Boolean(providedSecret),
            });
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const payload = await req.json();
        const record = payload?.record;
        const eventType = payload?.eventType ?? 'ORDER_INSERT';

        if (!record) {
            // Just a ping or invalid data
            return new Response(JSON.stringify({ message: "No record data" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // Determine the order context for the notification.
        let orderForNotification: any = null;
        let title: string;
        let body: string;
        let data: any = {};

        if (eventType === 'ORDER_ITEM_INSERT') {
            const orderId = record.order_id;
            if (!orderId) {
                return new Response(JSON.stringify({ message: 'No order_id on order item record' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            const { data: orderRow, error: orderError } = await supabaseClient
                .from('orders')
                .select('id, order_number, table_id, total_amount')
                .eq('id', orderId)
                .maybeSingle();

            if (orderError) {
                throw new Error(`Error fetching order for item insert: ${orderError.message}`);
            }

            orderForNotification = orderRow ?? { id: orderId };

            title = `Order Updated #${orderForNotification.order_number || orderForNotification.id} ✏️`;
            body = `+${record.quantity || 1} ${record.menu_item_name || 'item'} (Table ${orderForNotification.table_id || 'N/A'})`;
            data = { orderId: orderForNotification.id, type: 'update' };
        } else {
            if (!record.id) {
                return new Response(JSON.stringify({ message: 'No order id' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            orderForNotification = record;
            title = `New Order #${record.order_number || record.id} 🍔`;
            body = `Table ${record.table_id || 'N/A'} - ₹${record.total_amount}`;
            data = { orderId: record.id, type: 'new' };
        }

        console.log(`🔔 Processing notification. eventType=${eventType} orderId=${orderForNotification?.id ?? record?.id}`);

        // 1. Fetch Chef users with push tokens
        const { data: users, error: userError } = await supabaseClient
            .from('users')
            .select('expo_push_token')
            .eq('role', 'chef')
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
                title,
                body,
                data,
                channelId: 'Orders_v4',      // MATCHES CLIENT CHANNEL
                priority: 'high',            // MAX PRIORITY
            };
        }).filter(Boolean);

        // 3. Send to Expo
        const chunks = [];
        while (messages.length > 0) {
            chunks.push(messages.splice(0, 100));
        }

        const expoResults: any[] = [];

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
            expoResults.push(result);
        }

        return new Response(JSON.stringify({ message: "Notifications sent!", eventType, recipients: users.length, expoResults }), {
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
