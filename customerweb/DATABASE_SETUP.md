# Customer Website Database Configuration

## ✅ Fresh Setup Complete!

This customer website now has its own **self-contained database configuration** that doesn't reference any files outside the `customerweb` folder.

### 📁 Files Structure:

```
customerweb/
├── src/
│   ├── config/
│   │   └── supabase.ts           # Supabase client configuration
│   ├── services/
│   │   └── database.ts            # Database operations (customerDB)
│   └── hooks/
│       └── useSupabase.ts         # React hooks for data fetching
```

### 🔧 Configuration Files:

#### 1. **`src/config/supabase.ts`**
- Creates the Supabase client
- Uses same database as main app
- Exports: `supabase`, `db`, `testConnection()`

#### 2. **`src/services/database.ts`**
- Exports: `customerDB` object with methods:
  - `getMenuItems()` - Fetch approved menu items
  - `getAvailableTables()` - Fetch available tables
  - `createOrder()` - Create new orders
  - `subscribeToMenu()` - Real-time menu updates
  - `subscribeToTables()` - Real-time table updates
  - `unsubscribe()` - Clean up subscriptions

#### 3. **`src/hooks/useSupabase.ts`**
- Custom React hooks:
  - `useMenuItems()` - Fetch menu with real-time updates
  - `useAvailableTables()` - Fetch tables with real-time updates
  - `useCategories()` - Get unique menu categories

### 🎯 Usage Example:

```typescript
// In any React component
import { useMenuItems, useAvailableTables } from '../hooks/useSupabase';
import { customerDB } from '../services/database';

function MyComponent() {
    // Use hooks for data fetching
    const { menuItems, loading, error } = useMenuItems();
    const { tables } = useAvailableTables();
    
    // Or use customerDB directly
    const handleOrder = async () => {
        const result = await customerDB.createOrder({
            table_id: 1,
            customer_name: 'John',
            items: [...]
        });
    };
}
```

### 🔗 Database Connection:

- **URL**: `https://hncahlshvismwagbcryi.supabase.co`
- **Table Access**: 
  - ✅ `menu_items` (approved items only)
  - ✅ `restaurant_tables` (available tables)
  - ✅ `orders` (create only)
  - ✅ `order_items` (create only)

### ⚠️ Important Notes:

1. **RLS Policies Required**: Ensure Supabase has proper Row Level Security policies to allow:
   - Public READ on `menu_items` (where `status = 'approved'`)
   - Public READ on `restaurant_tables` (where `status = 'available'`)
   -INSERT on `orders` and `order_items`

2. **Real-time**: Subscriptions automatically refresh data when database changes

3. **Self-Contained**: All configuration is within `customerweb/` - no external dependencies

---

**Last Updated**: 2025-12-22  
**Status**: ✅ Ready to use
