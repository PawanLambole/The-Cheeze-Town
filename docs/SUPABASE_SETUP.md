# Supabase Database Setup

## ✅ Connection Configured

Your Supabase database is now connected and ready to use!

### Database Credentials
- **URL**: `https://hncahlshvismwagbcryi.supabase.co`
- **Anon Key**: `sb_publishable_vGkQyuWcVL1LvYM9HgG9pg_aeKgha2A`

## 📁 Files Created

1. **`config/supabase.ts`** - Supabase client configuration
2. **`services/database.ts`** - Database service layer with helper functions

## 🚀 How to Use

### Import the database service

```typescript
import { database, supabase } from '@/services/database';
```

### Basic CRUD Operations

#### Fetch all records
```typescript
const { data, error } = await database.getAll('your_table_name');
if (error) {
  console.error('Error:', error);
} else {
  console.log('Data:', data);
}
```

#### Fetch a single record by ID
```typescript
const { data, error } = await database.getById('your_table_name', 123);
```

#### Insert a new record
```typescript
const newItem = {
  name: 'Pizza',
  price: 299,
  category: 'Food'
};

const { data, error } = await database.insert('your_table_name', newItem);
```

#### Update a record
```typescript
const updates = {
  price: 349
};

const { data, error } = await database.update('your_table_name', 123, updates);
```

#### Delete a record
```typescript
const { error } = await database.delete('your_table_name', 123);
```

#### Custom query
```typescript
// Find all items with price greater than 200
const { data, error } = await database.query('your_table_name', 'price', 'gt', 200);
```

### Real-time Subscriptions

```typescript
import { database } from '@/services/database';

// Subscribe to changes
const subscription = database.subscribe('your_table_name', (payload) => {
  console.log('Change received!', payload);
  // payload.eventType can be 'INSERT', 'UPDATE', or 'DELETE'
  // payload.new contains the new record data
  // payload.old contains the old record data
});

// Unsubscribe when done
await database.unsubscribe(subscription);
```

### Advanced Usage with Supabase Client

For more complex queries, use the Supabase client directly:

```typescript
import { supabase } from '@/services/database';

// Complex query with joins and filters
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    customer:customers(name, email),
    items:order_items(*)
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
  .limit(10);
```

## 🎯 Usage Examples in Your App

### Example 1: Fetch Menu Items in Chef View

```typescript
// In app/chef/index.tsx
import { database } from '@/services/database';
import { useEffect, useState } from 'react';

export default function ChefScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    const { data, error } = await database.query('orders', 'status', 'eq', 'pending');
    if (!error) {
      setOrders(data);
    }
  };

  // ... rest of your component
}
```

### Example 2: Real-time Order Updates

```typescript
import { database } from '@/services/database';
import { useEffect } from 'react';

export default function OrdersScreen() {
  useEffect(() => {
    // Subscribe to order changes
    const subscription = database.subscribe('orders', (payload) => {
      if (payload.eventType === 'INSERT') {
        console.log('New order:', payload.new);
        // Add new order to state
      } else if (payload.eventType === 'UPDATE') {
        console.log('Order updated:', payload.new);
        // Update order in state
      }
    });

    // Cleanup subscription on unmount
    return () => {
      database.unsubscribe(subscription);
    };
  }, []);

  // ... rest of your component
}
```

### Example 3: Authentication

```typescript
import { supabase } from '@/config/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## 📊 Database Tables

You'll need to create tables in your Supabase dashboard. Common tables for a restaurant app might include:

- `users` - User accounts
- `orders` - Customer orders
- `menu_items` - Menu items
- `tables` - Restaurant tables
- `staff` - Staff information
- `payments` - Payment records
- `purchases` - Purchase records
- `inventory` - Inventory items

## 🔐 Security

> **Note**: The anon key is already configured in the code. For production apps, consider using environment variables and Row Level Security (RLS) policies in Supabase to secure your data.

### Setting up Row Level Security (RLS)

In your Supabase dashboard:
1. Go to Authentication > Policies
2. Enable RLS on your tables
3. Create policies to control access

Example policy:
```sql
-- Allow users to read only their own orders
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id);
```

## 🧪 Testing the Connection

To test if everything is working, you can add this to any component:

```typescript
import { testConnection } from '@/config/supabase';

// In your component
useEffect(() => {
  testConnection().then(connected => {
    console.log('Database connected:', connected);
  });
}, []);
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

Your database is ready to use! Start by creating tables in your Supabase dashboard and then use the database service to interact with them.

## 🔧 CLI Link & Login (Windows)

Use the Supabase CLI via NPX (no global install required) to link this repo to your Supabase project and manage schemas/migrations.

### Project Link

```powershell
# Verify CLI
npx supabase -v

# Link to your project (safe to re-run)
npx supabase link --project-ref hncahlshvismwagbcryi
```

### Login (recommended)

```powershell
# Interactive login (opens browser)
npx supabase login

# If interactive fails, create a Personal Access Token in Supabase Account Settings, then:
npx supabase login --token YOUR_ACCESS_TOKEN
```

### Common Commands

```powershell
# Generate TypeScript types from the linked project (saved to types/database.ts)
npx supabase gen types typescript --linked --schema public > types/database.ts

# Pull remote schema into local files (requires login)
npx supabase db pull

# Push local migrations to remote (requires login)
npx supabase db push

# Start local Supabase stack (requires Docker Desktop installed)
npx supabase start
```

### Environment Variables (Expo + Vite)

Ensure your apps can read Supabase URL and anon key via env vars:

```powershell
# Expo (native app)
$env:EXPO_PUBLIC_SUPABASE_URL = "https://hncahlshvismwagbcryi.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_vGkQyuWcVL1LvYM9HgG9pg_aeKgha2A"

# Vite (customerweb)
$env:VITE_SUPABASE_URL = "https://hncahlshvismwagbcryi.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "sb_publishable_vGkQyuWcVL1LvYM9HgG9pg_aeKgha2A"
```

You can persist these in `.env` files where appropriate for each app. 
