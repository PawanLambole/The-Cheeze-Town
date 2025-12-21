-- =====================================================
-- THE CHEEZE TOWN - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This script creates all tables, relationships, indexes,
-- triggers, and RLS policies for the restaurant management system
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://hncahlshvismwagbcryi.supabase.co
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this ENTIRE script
-- 4. Click "Run" to execute
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'waiter', 'customer')) DEFAULT 'customer',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MENU CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. MENU ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER REFERENCES menu_categories(id),
    category TEXT, -- Legacy support
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_vegetarian BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    calories INTEGER,
    ingredients TEXT[],
    allergens TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLES TABLE (Restaurant Tables)
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')) DEFAULT 'available',
    current_order_id INTEGER,
    location TEXT, -- e.g., 'indoor', 'outdoor', 'vip'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    table_id INTEGER REFERENCES restaurant_tables(id),
    customer_id UUID REFERENCES users(id),
    waiter_id UUID REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')) DEFAULT 'pending',
    order_type TEXT CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')) DEFAULT 'dine-in',
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    is_served BOOLEAN DEFAULT false,
    order_time TIMESTAMPTZ DEFAULT NOW(),
    prepared_time TIMESTAMPTZ,
    served_time TIMESTAMPTZ,
    completed_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    menu_item_name TEXT NOT NULL, -- Store name for historical records
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'served')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'phonepe', 'googlepay', 'paytm', 'other')) DEFAULT 'cash',
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. STAFF TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    employee_id TEXT UNIQUE,
    position TEXT NOT NULL,
    department TEXT,
    salary NUMERIC(10, 2),
    hire_date DATE DEFAULT CURRENT_DATE,
    termination_date DATE,
    status TEXT CHECK (status IN ('active', 'on-leave', 'terminated')) DEFAULT 'active',
    emergency_contact TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. STAFF PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_payments (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('salary', 'bonus', 'advance', 'deduction')) DEFAULT 'salary',
    payment_date DATE DEFAULT CURRENT_DATE,
    period_start DATE,
    period_end DATE,
    notes TEXT,
    paid_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT DEFAULT 'kg',
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    vendor_name TEXT,
    vendor_contact TEXT,
    invoice_number TEXT,
    receipt_url TEXT,
    purchase_date DATE DEFAULT CURRENT_DATE,
    purchased_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    reorder_level NUMERIC(10, 2),
    unit_cost NUMERIC(10, 2),
    supplier TEXT,
    last_restock_date DATE,
    expiry_date DATE,
    location TEXT, -- storage location
    status TEXT CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock', 'expired')) DEFAULT 'in-stock',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_type TEXT NOT NULL, -- e.g., 'rent', 'utilities', 'maintenance', 'marketing'
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    category TEXT,
    payment_method TEXT,
    receipt_url TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES users(id),
    vendor_name TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_period TEXT, -- e.g., 'monthly', 'weekly'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. RESERVATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    table_id INTEGER REFERENCES restaurant_tables(id),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')) DEFAULT 'pending',
    special_requests TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 14. CUSTOMER FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    customer_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    ambience_rating INTEGER CHECK (ambience_rating >= 1 AND ambience_rating <= 5),
    comments TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id),
    date DATE DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('present', 'absent', 'half-day', 'on-leave')) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to auto-update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD' || LPAD(nextval('orders_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to update inventory status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.status := 'out-of-stock';
    ELSIF NEW.quantity <= NEW.reorder_level THEN
        NEW.status := 'low-stock';
    ELSE
        NEW.status := 'in-stock';
    END IF;
    
    -- Check expiry
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_status
BEFORE INSERT OR UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations (you can customize these later)
-- PUBLIC READ POLICIES
CREATE POLICY "Allow public read on menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read on restaurant_tables" ON restaurant_tables FOR SELECT USING (true);

-- AUTHENTICATED USERS POLICIES
CREATE POLICY "Allow authenticated users to read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update orders" ON orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update order_items" ON order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete order_items" ON order_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users all on payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on staff" ON staff FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on staff_payments" ON staff_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on inventory" ON inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on expenses" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on reservations" ON reservations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on feedback" ON feedback FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users all on attendance" ON attendance FOR ALL TO authenticated USING (true);

-- For anonymous/public access (useful for customer-facing features)
CREATE POLICY "Allow anon read on menu_items" ON menu_items FOR SELECT TO anon USING (is_available = true);
CREATE POLICY "Allow anon insert on feedback" ON feedback FOR INSERT TO anon WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample menu categories
INSERT INTO menu_categories (name, description, display_order) VALUES
    ('Pizza', 'Delicious hand-tossed pizzas', 1),
    ('Burgers', 'Juicy gourmet burgers', 2),
    ('Sides', 'Perfect accompaniments', 3),
    ('Beverages', 'Refreshing drinks', 4),
    ('Desserts', 'Sweet treats', 5)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, is_available, preparation_time, is_vegetarian) VALUES
    ('Margherita Pizza', 'Classic tomato and mozzarella', 299, 'Pizza', true, 15, true),
    ('Farmhouse Pizza', 'Loaded with fresh vegetables', 349, 'Pizza', true, 18, true),
    ('Tandoori Paneer Pizza', 'Indian-style paneer pizza', 399, 'Pizza', true, 20, true),
    ('Chicken Supreme Pizza', 'Loaded with chicken and veggies', 449, 'Pizza', true, 20, false),
    ('Pepperoni Pizza', 'Classic pepperoni delight', 429, 'Pizza', true, 18, false),
    ('Classic Burger', 'Juicy beef patty with fresh veggies', 199, 'Burgers', true, 12, false),
    ('Veggie Burger', 'Plant-based patty', 179, 'Burgers', true, 12, true),
    ('Chicken Burger', 'Grilled chicken breast', 219, 'Burgers', true, 15, false),
    ('French Fries', 'Crispy golden fries', 99, 'Sides', true, 8, true),
    ('Garlic Bread', 'Toasted bread with garlic butter', 89, 'Sides', true, 10, true),
    ('Onion Rings', 'Crispy battered onion rings', 119, 'Sides', true, 10, true),
    ('Coke', 'Chilled Coca-Cola', 49, 'Beverages', true, 2, true),
    ('Sprite', 'Refreshing lemon-lime soda', 49, 'Beverages', true, 2, true),
    ('Iced Tea', 'Fresh brewed iced tea', 69, 'Beverages', true, 3, true),
    ('Chocolate Brownie', 'Warm chocolate brownie', 129, 'Desserts', true, 8, true),
    ('Ice Cream', 'Vanilla ice cream (2 scoops)', 99, 'Desserts', true, 5, true)
ON CONFLICT DO NOTHING;

-- Insert sample tables
INSERT INTO restaurant_tables (table_number, capacity, status, location) VALUES
    (1, 2, 'available', 'indoor'),
    (2, 2, 'available', 'indoor'),
    (3, 4, 'available', 'indoor'),
    (4, 4, 'available', 'indoor'),
    (5, 4, 'available', 'indoor'),
    (6, 6, 'available', 'indoor'),
    (7, 6, 'available', 'outdoor'),
    (8, 8, 'available', 'outdoor'),
    (9, 2, 'available', 'vip'),
    (10, 4, 'available', 'vip')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - menu_categories';
    RAISE NOTICE '  - menu_items';
    RAISE NOTICE '  - restaurant_tables';
    RAISE NOTICE '  - orders';
    RAISE NOTICE '  - order_items';
    RAISE NOTICE '  - payments';
    RAISE NOTICE '  - staff';
    RAISE NOTICE '  - staff_payments';
    RAISE NOTICE '  - purchases';
    RAISE NOTICE '  - inventory';
    RAISE NOTICE '  - expenses';
    RAISE NOTICE '  - reservations';
    RAISE NOTICE '  - feedback';
    RAISE NOTICE '  - attendance';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample data inserted:';
    RAISE NOTICE '  - 5 menu categories';
    RAISE NOTICE '  - 16 menu items';
    RAISE NOTICE '  - 10 restaurant tables';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Your database is ready to use!';
    RAISE NOTICE '========================================';
END $$;
