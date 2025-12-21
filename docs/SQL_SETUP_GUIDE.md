# 🎯 Complete SQL Setup for The Cheeze Town

## 📋 How to Run the SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to: **https://hncahlshvismwagbcryi.supabase.co**
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Copy & Paste the SQL
1. Open the file: `supabase-setup.sql` (in your project root)
2. Select ALL the content (Ctrl+A)
3. Copy it (Ctrl+C)
4. Paste it into the Supabase SQL Editor

### Step 3: Execute
1. Click the **"Run"** button (or press Ctrl+Enter)
2. Wait for completion (should take 10-20 seconds)
3. You should see success messages

## 📊 What This Creates

### ✅ 15 Database Tables

1. **users** - User accounts (owner, manager, chef, waiter, customer)
2. **menu_categories** - Menu organization (Pizza, Burgers, etc.)
3. **menu_items** - All menu items with prices and details
4. **restaurant_tables** - Table management (10 tables created)
5. **orders** - Customer orders
6. **order_items** - Items in each order
7. **payments** - Payment transactions
8. **staff** - Employee information
9. **staff_payments** - Salary and payment records
10. **purchases** - Purchase records for inventory
11. **inventory** - Stock management
12. **expenses** - Business expenses (rent, utilities, etc.)
13. **reservations** - Table reservations
14. **feedback** - Customer reviews and ratings
15. **attendance** - Staff attendance tracking

### 🔧 Additional Features

- **Indexes** for fast queries
- **Triggers** to auto-update timestamps and totals
- **Functions** for:
  - Auto-generating order numbers (ORD000001, ORD000002, etc.)
  - Auto-calculating order totals
  - Auto-updating inventory status
- **Row Level Security (RLS)** policies for data protection

### 📝 Sample Data Included

- ✅ **5 Menu Categories** (Pizza, Burgers, Sides, Beverages, Desserts)
- ✅ **16 Menu Items** (Pizzas, Burgers, Drinks, etc.)
- ✅ **10 Restaurant Tables** (Tables 1-10 with different capacities)

## 🚀 After Running the SQL

### Verify Tables Created

In Supabase Dashboard:
1. Go to **"Table Editor"** in the left sidebar
2. You should see all 15 tables listed
3. Click on **menu_items** to see the sample menu data
4. Click on **restaurant_tables** to see the tables

### Test the Connection

Add this to your component:

```typescript
import { database } from '@/services/database';

// Test fetching menu items
const testDatabase = async () => {
  const { data, error } = await database.getAll('menu_items');
  console.log('Menu Items:', data);
  console.log('Error:', error);
};
```

## 📘 Database Schema Overview

### Orders Flow
```
orders (main order)
  ├── order_items (multiple items per order)
  ├── payments (payment for the order)
  └── restaurant_tables (which table)
```

### Menu Structure
```
menu_categories
  └── menu_items (belongs to category)
```

### Staff Management
```
users (basic info)
  └── staff (additional staff details)
      └── staff_payments (salary payments)
```

### Financial Tracking
```
orders → revenue
purchases → inventory costs
expenses → operational costs
```

## 🔐 Security (RLS Policies)

The SQL includes basic RLS policies:

- **Public Access**: Menu items, menu categories (read-only)
- **Authenticated Users**: Full access to orders, payments, staff, etc.
- **Anonymous**: Can view available menu items, submit feedback

### To Temporarily Disable RLS (for testing):

```sql
ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
```

### To Re-enable RLS:

```sql
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
```

## 📊 Key Features

### Auto Order Numbers
Orders automatically get numbers like: ORD000001, ORD000002, etc.

### Auto Total Calculation
When you add/remove order items, the order total updates automatically!

### Inventory Status
Inventory items automatically update their status:
- **in-stock**: Normal quantity
- **low-stock**: Below reorder level
- **out-of-stock**: Quantity = 0
- **expired**: Past expiry date

## 🎯 Integration Points with Your App

### Chef Dashboard (`app/chef/index.tsx`)
```typescript
// Fetch pending orders
const { data: orders } = await database.query('orders', 'status', 'eq', 'pending');
```

### Manager - Tables (`app/manager/tables.tsx`)
```typescript
// Fetch all tables
const { data: tables } = await database.getAll('restaurant_tables');

// Update table status
await database.update('restaurant_tables', tableId, { status: 'occupied' });
```

### Manager - Orders (`app/manager/orders.tsx`)
```typescript
// Fetch all orders with real-time updates
const { data: orders } = useSupabaseRealtimeQuery('orders');
```

### Manager - Staff (`app/manager/staff.tsx`)
```typescript
// Fetch all staff members
const { data: staff } = await database.getAll('staff');
```

### Manager - Purchases (`app/manager/purchases.tsx`)
```typescript
// Add new purchase
await database.insert('purchases', {
  item_name: 'Cheese',
  quantity: 10,
  unit: 'kg',
  unit_price: 450,
  total_amount: 4500,
  vendor_name: 'ABC Dairy'
});
```

### Manager - Revenue (`app/manager/revenue.tsx`)
```typescript
// Get today's revenue
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('orders')
  .select('total_amount')
  .eq('status', 'completed')
  .gte('created_at', today);

const totalRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0);
```

### Manager - Expenses (`app/manager/expenses.tsx`)
```typescript
// Add expense
await database.insert('expenses', {
  expense_type: 'Electricity',
  amount: 5000,
  category: 'utilities',
  expense_date: new Date().toISOString()
});
```

## 🛠️ Common Queries

### Get today's orders
```typescript
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('orders')
  .select('*')
  .gte('created_at', today);
```

### Get orders with items
```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      *,
      menu_item:menu_items (name, price)
    ),
    table:restaurant_tables (table_number)
  `);
```

### Get active tables
```typescript
const { data } = await database.query('restaurant_tables', 'status', 'eq', 'occupied');
```

### Get low stock items
```typescript
const { data } = await database.query('inventory', 'status', 'eq', 'low-stock');
```

## ✅ Next Steps

1. ✅ Run the SQL script in Supabase
2. ✅ Verify tables are created
3. ✅ Test fetching menu items
4. ✅ Start integrating into your React Native screens
5. ✅ Use the hooks from `hooks/useSupabase.ts`

## 📞 Need Help?

- Check `docs/SUPABASE_SETUP.md` for detailed documentation
- Check `docs/database-examples.tsx` for code examples
- Check Supabase docs: https://supabase.com/docs

---

**Your database is production-ready!** 🎉 All tables, relationships, and sample data are configured.
