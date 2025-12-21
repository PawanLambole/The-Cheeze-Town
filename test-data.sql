-- Quick Test Data Script
-- Run this in Supabase SQL Editor to create test orders

-- Insert a test order
DO $$
DECLARE
    test_order_id INTEGER;
BEGIN
    -- Create a new test order
    INSERT INTO orders (table_id, status, order_type, total_amount)
    VALUES (3, 'pending', 'dine-in', 0)
    RETURNING id INTO test_order_id;

    -- Add order items
    INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, unit_price, total_price, special_instructions)
    VALUES 
        (test_order_id, 1, 'Margherita Pizza', 1, 299, 299, 'Extra cheese please'),
        (test_order_id, 9, 'French Fries', 2, 99, 198, NULL),
        (test_order_id, 12, 'Coke', 2, 49, 98, NULL);

    -- Update order total
    UPDATE orders 
    SET total_amount = (SELECT SUM(total_price) FROM order_items WHERE order_id = test_order_id)
    WHERE id = test_order_id;

    RAISE NOTICE 'Test order created successfully! Order Number: %', (SELECT order_number FROM orders WHERE id = test_order_id);
END $$;
