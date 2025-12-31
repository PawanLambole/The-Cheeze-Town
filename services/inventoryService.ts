
import { supabase } from '@/services/database';

interface OrderItem {
    id?: number | string;
    order_id?: number | string;
    menu_item_name: string;
    quantity: number;
}

/**
 * Deducts inventory stock based on the menu items in an order.
 * This should be called *after* an order is successfully created or items are added.
 */
export const deductInventoryForOrder = async (orderItems: OrderItem[]) => {
    if (!orderItems || orderItems.length === 0) return;

    try {
        console.log(`Starting inventory deduction for ${orderItems.length} items...`);

        // 1. Get all unique menu item names from the order
        const menuItemNames = [...new Set(orderItems.map(item => item.menu_item_name))];

        // 2. Fetch menu items to get their IDs
        // We match by name because order_items usually stores the name (snapshot)
        // Ideally order_items should store menu_item_id, but per schema it seems loose.
        // Let's assume name matching is sufficient or order_items has menu_item_id? 
        // Checking create-order.tsx: order_items has menu_item_name.
        // If order_items doesn't have menu_item_id, we must query by name.

        const { data: menuItems, error: menuError } = await supabase
            .from('menu_items')
            .select('id, name')
            .in('name', menuItemNames);

        if (menuError) {
            console.error("Error fetching menu items for inventory deduction:", menuError);
            return;
        }

        if (!menuItems || menuItems.length === 0) {
            console.log("No matching menu items found for deduction.");
            return;
        }

        // 3. For each found menu item, fetch its ingredients w/ quantity
        const menuItemIds = menuItems.map(m => m.id);
        const { data: ingredients, error: ingError } = await supabase
            .from('menu_item_ingredients' as any)
            .select('menu_item_id, inventory_item_id, quantity')
            .in('menu_item_id', menuItemIds);

        if (ingError) {
            console.error("Error fetching ingredients for deduction:", ingError);
            return;
        }

        if (!ingredients || ingredients.length === 0) {
            console.log("No linked ingredients found for these items.");
            return;
        }

        // 4. Calculate total deduction per inventory item
        const deductionMap = new Map<number, number>(); // inventory_item_id -> total_quantity_to_deduct

        for (const orderItem of orderItems) {
            // Find the menu item ID for this order item
            const menuItem = menuItems.find(m => m.name === orderItem.menu_item_name);
            if (!menuItem) continue;

            // Find all ingredients for this menu item
            const itemIngredients = (ingredients as any[] || []).filter((i: any) => i.menu_item_id === menuItem.id);

            for (const ingredient of itemIngredients) {
                const totalDeduction = ingredient.quantity * orderItem.quantity;
                const currentTotal = deductionMap.get(ingredient.inventory_item_id) || 0;
                deductionMap.set(ingredient.inventory_item_id, currentTotal + totalDeduction);
            }
        }

        // 5. Perform the updates (RPC would be better for atomicity, but loop update is acceptable for MVP)
        // We should fetch current stock first to ensure we don't go negative or just let it go negative?
        // User requirement: "decrease the quantity".
        // We'll perform an RPC call 'decrement_inventory' if it existed, or just read-modify-write.
        // To safe guard against concurrency, let's use a stored procedure if possible? 
        // Or just simple updates. Given current setup, simple updates.

        // Optimisation: Fetch all inventory items involved first to get current stock?
        // Or just update directly: quantity = quantity - X

        // Supabase JS doesn't support "decrement" directly in update without RPC. 
        // So we must fetch current values.

        const inventoryIds = Array.from(deductionMap.keys());
        const { data: currentStockData, error: stockError } = await supabase
            .from('inventory')
            .select('id, quantity')
            .in('id', inventoryIds);

        if (stockError) {
            console.error("Error fetching current stock:", stockError);
            return;
        }

        const updates = currentStockData.map((inv: any) => {
            const deductAmount = deductionMap.get(inv.id) || 0;
            return {
                id: inv.id,
                quantity: inv.quantity - deductAmount
            };
        });

        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: update.quantity })
                .eq('id', update.id);

            if (updateError) {
                console.error(`Error updating inventory item ${update.id}:`, updateError);
            } else {
                console.log(`Deducted ${deductionMap.get(update.id)} from inventory item ${update.id}. New stock: ${update.quantity}`);
            }
        }

    } catch (err) {
        console.error("Unexpected error in deductInventoryForOrder:", err);
    }
};
