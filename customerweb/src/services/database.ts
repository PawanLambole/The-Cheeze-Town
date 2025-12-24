/**
 * Customer Website Database Service (Mock / No Database)
 *
 * This implementation uses in-memory mock data so the
 * customer website can run without any external database.
 */

// Simple mock menu and table data
const mockMenuItems = [
    { id: 1, name: 'Margherita Pizza', description: 'Classic cheese pizza', price: 299, category: 'Pizza', status: 'approved', is_vegetarian: true },
    { id: 2, name: 'Pepperoni Pizza', description: 'Spicy pepperoni', price: 399, category: 'Pizza', status: 'approved', is_vegetarian: false },
    { id: 3, name: 'Veggie Burger', description: 'Healthy vegetable burger', price: 199, category: 'Burgers', status: 'approved', is_vegetarian: true },
];

const mockTables = [
    { id: 1, table_number: 1, capacity: 2, status: 'available', location: 'indoor' },
    { id: 2, table_number: 2, capacity: 4, status: 'available', location: 'indoor' },
    { id: 3, table_number: 3, capacity: 6, status: 'available', location: 'outdoor' },
];

let nextOrderId = 1;

export const customerDB = {
    /**
     * Get all approved menu items (from mock data)
     */
    async getMenuItems() {
        return { data: mockMenuItems, error: null };
    },

    /**
     * Get available tables (from mock data)
     */
    async getAvailableTables() {
        const available = mockTables.filter(t => t.status === 'available');
        return { data: available, error: null };
    },

    /**
     * Create a new order (mocked)
     */
    async createOrder(orderData: {
        table_id: number;
        customer_name?: string;
        items: Array<{ menu_item_name: string; quantity: number; unit_price: number }>;
    }) {
        const orderNumber = `WEB${String(nextOrderId).padStart(4, '0')}`;
        const totalAmount = orderData.items.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0
        );

        const order = {
            id: nextOrderId++,
            order_number: orderNumber,
            table_id: orderData.table_id,
            customer_name: orderData.customer_name || null,
            status: 'pending',
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
        };

        console.log('Mock createOrder:', { order, items: orderData.items });
        return { data: order, error: null };
    },

    /**
     * Subscribe to menu changes (no-op in mock mode)
     */
    subscribeToMenu(_callback: (payload: any) => void) {
        console.log('Mock subscribeToMenu called (no real-time database).');
        return {
            unsubscribe() {
                console.log('Mock menu subscription unsubscribed.');
            },
        };
    },

    /**
     * Subscribe to table changes (no-op in mock mode)
     */
    subscribeToTables(_callback: (payload: any) => void) {
        console.log('Mock subscribeToTables called (no real-time database).');
        return {
            unsubscribe() {
                console.log('Mock table subscription unsubscribed.');
            },
        };
    },

    /**
     * Unsubscribe from a channel (compatible with existing hooks)
     */
    async unsubscribe(subscription: { unsubscribe?: () => void }) {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
    },
};

// Default export for convenience
export default customerDB;

// No real supabase client is exported anymore; keep a stub for safety
export const supabase = null as null;
