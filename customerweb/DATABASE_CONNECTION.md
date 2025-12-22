# Customer Web Interface - Database Connection

## Overview
The customer web interface is now connected to the same Supabase database as your mobile app. This allows customers to view the menu, place orders, and see real-time updates.

## Files Created

### 1. `src/config/supabase.ts`
- Supabase client configuration
- Uses the same database credentials as the mobile app
- Includes connection testing function

### 2. `src/services/database.ts`
- Customer database service layer
- Functions for:
  - Fetching menu items
  - Getting categories
  - Fetching available tables
  - Creating customer orders
  - Real-time subscriptions

### 3. `src/hooks/useDatabase.ts`
- Custom React hooks for database operations
- `useMenuItems()` - Fetch menu items with real-time updates
  - `useCategor` - Fetch unique menu categories
- `useAvailableTables()` - Fetch available tables

## How to Use

### In Your Components

#### 1. Fetch Menu Items
```tsx
import { useMenuItems } from './hooks/useDatabase';

function MenuPage() {
  const { menuItems, loading, error, refetch } = useMenuItems();

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div>Error loading menu</div>;

  return (
    <div>
      {menuItems.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p>₹{item.price}</p>
        </div>
      ))}
    </div>
  );
}
```

#### 2. Fetch Categories
```tsx
import { useCategories } from './hooks/useDatabase';

function CategoryFilter() {
  const { categories, loading } = useCategories();

  return (
    <div>
      {categories.map(category => (
        <button key={category}>{category}</button>
      ))}
    </div>
  );
}
```

#### 3. Create an Order
```tsx
import customerDB from './services/database';

async function placeOrder(tableId: number, items: any[]) {
  const orderData = {
    table_id: tableId,
    customer_name: 'Customer Name',
    items: items.map(item => ({
      menu_item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price
    }))
  };

  const { data, error } = await customerDB.createOrder(orderData);

  if (error) {
    console.error('Order failed:', error);
    alert('Failed to place order');
  } else {
    console.log('Order placed:', data);
    alert(`Order ${data.order_number} placed successfully!`);
  }
}
```

## Database Tables Used

### 1. `menu_items`
- **Columns**: id, name, description, price, category, status
- **Filter**: Only fetches `status = 'approved'`

### 2. `restaurant_tables`
- **Columns**: id, table_number, status, current_order_id
- **Filter**: Only fetches `status = 'available'`

### 3. `orders`
- **Columns**: id, order_number, table_id, customer_name, status, total_amount, order_type
- **Creates**: New orders with status = 'pending'

### 4. `order_items`
- **Columns**: id, order_id, menu_item_name, quantity, unit_price, total_price
- **Links**: Order items to orders

## Real-Time Updates

The customer web interface automatically subscribes to menu changes:
- When managers/owners update menu items, customers see updates instantly
- No page refresh required

## Running the Customer Web Interface

```bash
cd customerweb
npm install
npm run dev
```

The app will run on `http://localhost:5173` (or the next available port)

## Environment Variables

The database credentials are hardcoded in `src/config/supabase.ts`. For production, you should:

1. Create a `.env` file:
```env
VITE_SUPABASE_URL=https://hncahlshvismwagbcryi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Update `src/config/supabase.ts`:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Security

- The web interface uses the same Row Level Security (RLS) policies as the mobile app
- Customers can only:
  - View approved menu items
  - See available tables
  - Create orders (not edit or delete existing ones)

## Next Steps

1. **Update your existing pages** to use the new database hooks
2. **Test the connection** by running the web app
3. **Implement order placement** UI  
4. **Add loading and error states** to your components

## Troubleshooting

### Connection Issues
Run the test function to verify database connectivity:
```typescript
import { testConnection } from './config/supabase';

testConnection().then(success => {
  console.log('Connected:', success);
});
```

### No Menu Items Showing
- Check that menu items exist in the database
- Verify items have `status = 'approved'`
- Check browser console for errors

### Orders Not Creating
- Ensure table_id is valid
- Check that items array is not empty
- Verify user has permission to insert orders (check RLS policies)
