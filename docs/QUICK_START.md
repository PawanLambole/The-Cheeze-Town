# 🚀 Quick Start Guide - Supabase Database Connection

## ✅ What's Been Set Up

Your project is now fully configured to work with Supabase! Here's what's ready:

### Files Created:
1. ✅ `config/supabase.ts` - Supabase client configuration
2. ✅ `services/database.ts` - Database service with helper functions
3. ✅ `hooks/useSupabase.ts` - Custom React hooks for database operations
4. ✅ `types/database.ts` - TypeScript types for your database tables
5. ✅ `docs/database-examples.tsx` - Usage examples
6. ✅ `docs/SUPABASE_SETUP.md` - Complete documentation

## 📋 Next Steps

### 1. Create Database Tables in Supabase

Go to your Supabase dashboard and create the tables you need:

**URL**: https://hncahlshvismwagbcryi.supabase.co

Common tables for a restaurant app:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'waiter', 'customer')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  preparation_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables table
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
  current_order_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE,
  table_id INTEGER REFERENCES tables(id),
  customer_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT CHECK (method IN ('cash', 'card', 'upi', 'phonepe', 'other')),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  position TEXT NOT NULL,
  salary NUMERIC(10, 2),
  hire_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  reorder_level NUMERIC(10, 2),
  last_restock_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Set Up Row Level Security (RLS)

Enable RLS on your tables for security:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... repeat for other tables

-- Example policies
CREATE POLICY "Enable read for all users" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 3. Test the Connection

Add this to any component to test:

```typescript
import { testConnection } from '@/config/supabase';
import { useEffect } from 'react';

export default function YourComponent() {
  useEffect(() => {
    testConnection().then(connected => {
      console.log('Database connected:', connected);
    });
  }, []);

  // ... rest of your component
}
```

### 4. Use in Your Components

#### Simple Example - Fetch Menu Items:

```typescript
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { MenuItem } from '@/types/database';

export default function MenuScreen() {
  const { data: menuItems, loading, error } = useSupabaseQuery<MenuItem>('menu_items');

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <FlatList
      data={menuItems}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>₹{item.price}</Text>
        </View>
      )}
    />
  );
}
```

#### Real-time Example - Chef Orders:

```typescript
import { useSupabaseRealtimeQuery } from '@/hooks/useSupabase';
import { Order } from '@/types/database';

export default function ChefScreen() {
  const { data: orders, loading } = useSupabaseRealtimeQuery<Order>('orders');
  
  // Filter pending orders
  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <View>
      <Text>Pending Orders: {pendingOrders.length}</Text>
      {/* Your order list */}
    </View>
  );
}
```

## 🎯 Current Integration Points

Based on your project structure, here are the best places to integrate the database:

### 1. Chef Dashboard (`app/chef/index.tsx`)
- Fetch pending orders
- Update order status to "preparing" or "ready"
- Real-time order notifications

### 2. Manager Screens
- `app/manager/tables.tsx` - Manage table status
- `app/manager/orders.tsx` - View all orders
- `app/manager/staff/[id].tsx` - Staff management
- `app/manager/purchases.tsx` - Purchase records
- `app/manager/revenue.tsx` - Revenue analytics

### 3. Owner Dashboard (`app/owner/index.tsx`)
- Overview statistics
- Revenue tracking
- Staff performance

## 🔧 Troubleshooting

### If you get connection errors:

1. **Check your Supabase URL and API Key** in `config/supabase.ts`
2. **Verify tables exist** in your Supabase dashboard
3. **Check RLS policies** - They might be blocking access
4. **Enable anonymous access** if needed (in Supabase dashboard under Authentication)

### To disable RLS temporarily for testing:

```sql
ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
```

## 📚 Resources

- **Full Documentation**: See `docs/SUPABASE_SETUP.md`
- **Code Examples**: See `docs/database-examples.tsx`
- **Supabase Dashboard**: https://hncahlshvismwagbcryi.supabase.co

## 🎉 You're All Set!

Your database is ready to use. Start by:
1. Creating tables in Supabase dashboard
2. Testing the connection
3. Integrating into your screens

Need help? Check the documentation files or refer to the examples!
