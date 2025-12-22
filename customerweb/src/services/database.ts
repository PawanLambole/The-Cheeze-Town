import { supabase } from '../config/supabase';

/**
 * Customer Website Database Service
 * Handles all database operations for the customer-facing website
 */
export const customerDB = {
    /**
     * Get all approved menu items
     */
    async getMenuItems() {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('status', 'approved')
                .order('category', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching menu items:', error);
            return { data: null, error };
        }
    },

    /**
     * Get available tables
     */
    async getAvailableTables() {
        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('status', 'available')
                .order('table_number', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching tables:', error);
            return { data: null, error };
        }
    },

    /**
     * Create a new order with items
     */
    async createOrder(orderData: {
        table_id: number;
        customer_name?: string;
        items: Array<{ menu_item_name: string; quantity: number; unit_price: number }>;
    }) {
        try {
            // Generate order number
            const orderNumber = `WEB${Date.now().toString().slice(-6)}`;

            // Calculate total
            const totalAmount = orderData.items.reduce(
                (sum, item) => sum + (item.unit_price * item.quantity),
                0
            );

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    order_number: orderNumber,
                    table_id: orderData.table_id,
                    customer_name: orderData.customer_name || null,
                    status: 'pending',
                    total_amount: totalAmount,
                    order_type: 'dine-in'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Add order items
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                menu_item_name: item.menu_item_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Update table status
            await supabase
                .from('restaurant_tables')
                .update({
                    status: 'occupied',
                    current_order_id: order.id
                })
                .eq('id', orderData.table_id);

            return { data: order, error: null };
        } catch (error) {
            console.error('Error creating order:', error);
            return { data: null, error };
        }
    },

    /**
     * Subscribe to menu changes
     */
    subscribeToMenu(callback: (payload: any) => void) {
        return supabase
            .channel('menu_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'menu_items' },
                callback
            )
            .subscribe();
    },

    /**
     * Subscribe to table changes
     */
    subscribeToTables(callback: (payload: any) => void) {
        return supabase
            .channel('table_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'restaurant_tables' },
                callback
            )
            .subscribe();
    },

    /**
     * Unsubscribe from a channel
     */
    async unsubscribe(subscription: any) {
        await supabase.removeChannel(subscription);
    },
};

// Default export for convenience
export default customerDB;

// Export supabase client for advanced usage
export { supabase };
