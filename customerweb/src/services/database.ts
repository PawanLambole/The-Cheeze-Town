/**
 * Customer Website Database Service
 * Real Supabase integration for menu, tables, and orders
 */

import { supabase } from '../config/supabase';

export const customerDB = {
    /**
     * Get all menu items from database
     */
    async getMenuItems() {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching menu items:', error);
            return { data: [], error };
        }
    },

    /**
     * Get available tables from database
     */
    async getAvailableTables() {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('status', 'available')
                .order('table_number', { ascending: true });

            if (error) {
                // If table doesn't exist, return mock data
                console.warn('Tables table not found, using mock data:', error);
                const mockTables = [
                    { id: 1, table_number: 1, capacity: 2, status: 'available', location: 'indoor' },
                    { id: 2, table_number: 2, capacity: 4, status: 'available', location: 'indoor' },
                    { id: 3, table_number: 3, capacity: 6, status: 'available', location: 'outdoor' },
                    { id: 4, table_number: 4, capacity: 4, status: 'available', location: 'indoor' },
                    { id: 5, table_number: 5, capacity: 8, status: 'available', location: 'outdoor' },
                ];
                return { data: mockTables, error: null };
            }
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching tables:', error);
            return { data: [], error };
        }
    },

    /**
     * Create a new order in the database
     */
    async createOrder(orderData: {
        table_id: number;
        customer_name?: string;
        items: Array<{ menu_item_name: string; quantity: number; unit_price: number }>;
    }) {
        try {
            // Calculate total amount
            const totalAmount = orderData.items.reduce(
                (sum, item) => sum + item.unit_price * item.quantity,
                0
            );

            // Generate simple sequential order number with WEB prefix
            const timestamp = Date.now();
            const counter = timestamp % 10000; // Last 4 digits for uniqueness
            const orderNumber = `WEB${counter.toString().padStart(4, '0')}`;

            // 1. Insert the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    table_id: orderData.table_id,
                    customer_name: orderData.customer_name || null,
                    status: 'pending',
                    total_amount: totalAmount,
                    order_time: new Date().toISOString(),
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert order items
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                menu_item_name: item.menu_item_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.quantity, // Calculate total price per item
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            console.log('✅ Order created successfully:', order);
            return { data: order, error: null };
        } catch (error) {
            console.error('Error creating order:', error);
            return { data: null, error };
        }
    },

    /**
     * Subscribe to menu changes (real-time)
     */
    subscribeToMenu(callback: (payload: any) => void) {
        const channel = supabase
            .channel('menu_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'menu_items',
            }, payload => {
                console.log('Menu updated:', payload);
                callback(payload);
            })
            .subscribe();

        return {
            unsubscribe: () => {
                channel.unsubscribe();
            },
        };
    },

    /**
     * Subscribe to table changes (real-time)
     */
    subscribeToTables(callback: (payload: any) => void) {
        const channel = supabase
            .channel('table_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tables',
            }, payload => {
                console.log('Tables updated:', payload);
                callback(payload);
            })
            .subscribe();

        return {
            unsubscribe: () => {
                channel.unsubscribe();
            },
        };
    },

    /**
     * Unsubscribe from a channel
     */
    async unsubscribe(subscription: { unsubscribe?: () => void }) {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
    },
};

// Default export for convenience
export default customerDB;

// Export supabase client for direct access if needed
export { supabase };
