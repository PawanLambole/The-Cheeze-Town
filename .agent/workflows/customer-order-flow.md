---
description: Customer to Application Order Flow Integration
---

# Customer Website to Application Order Flow

This workflow describes how customer orders placed on the website are integrated with the main application.

## Overview

The customer website (`customerweb`) is now fully integrated with the main application database. When customers place orders through the website, they appear in real-time in the application's order management system.

## Order Flow

### 1. Customer Views Menu
- Website fetches approved menu items from the database in real-time
- Menu items are displayed with prices, categories, and descriptions
- Customers can browse and add items to their cart

### 2. Customer Adds Items to Cart
- Items are stored in local state (CartContext)
- Cart persists across page navigation within the session
- Real-time updates as items are added/removed

### 3. Customer Places Order
- Customer clicks "Place Order" button
- Redirected to Table Selection page

### 4. Customer Selects Table
- Website fetches available tables from `restaurant_tables` table
- Only shows tables with `status = 'available'`
- Customer selects their table number
- Continues to payment

### 5. Customer Enters Details & Pays
- Optional: Customer name input
- Payment method selection (QR, UPI, or Card)
- On payment completion, order is created in database

### 6. Order Created in Database
The following happens when payment is completed:

a. **Order Record Created** in `orders` table:
   - `order_number`: Auto-generated (format: WEB######)
   - `table_id`: Selected table ID
   - `customer_name`: Optional customer name
   - `status`: Set to 'pending'
   - `total_amount`: Calculated from cart items
   - `order_type`: Set to 'dine-in'

b. **Order Items Created** in `order_items` table:
   - Multiple records, one for each cart item
   - Links to the created order via `order_id`
   - Contains: `menu_item_name`, `quantity`, `unit_price`, `total_price`

c. **Table Updated** in `restaurant_tables` table:
   - `status`: Changed from 'available' to 'occupied'
   - `current_order_id`: Set to the new order ID

### 7. Order Appears in Application
- Manager sees order in Orders tab (`app/manager/orders.tsx`)
- Order appears with 'pending' status
- Manager can view order details, items, and table
- Manager can update order status (preparing, ready, completed)
- Manager can process payment

## Database Schema Used

### Tables Involved:
1. **menu_items** - Stores all menu items (filtered by status='approved' for website)
2. **orders** - Stores order headers
3. **order_items** - Stores individual items in each order
4. **restaurant_tables** - Manages table availability and assignments

## Real-time Updates

The website uses Supabase real-time subscriptions for:
- Menu updates (when items are added/modified in app)
- Table availability (when tables become available)

## Testing the Integration

### Start the Customer Website:
```bash
cd customerweb
npm run dev
```

### Start the Main Application:
```bash
npx expo start --tunnel
```

### Test Flow:
1. Open customer website in browser (usually http://localhost:5173)
2. Browse menu (should show real items from database)
3. Add items to cart
4. Place order
5. Select an available table
6. Complete payment
7. Check the mobile app's Orders tab - order should appear immediately

## Important Configuration

Both systems use the same Supabase instance:
- **URL**: `https://hncahlshvismwagbcryi.supabase.co`
- **Database**: Same PostgreSQL database
- **Real-time**: Enabled for instant sync

## Troubleshooting

### Orders not appearing in app:
1. Check Supabase connection in both systems
2. Verify table exists and is available
3. Check browser console for errors
4. Ensure database permissions are correct

### Menu not loading on website:
1. Verify menu items have `status = 'approved'`
2. Check Supabase connection
3. Look for errors in browser console
4. Test connection: Open browser console and run `testConnection()` function

### Table selection shows no tables:
1. Ensure tables exist in `restaurant_tables` table
2. Check that at least one table has `status = 'available'`
3. Create tables via the app if needed

## File Locations

### Customer Website:
- **Menu Data Hook**: `customerweb/src/hooks/useDatabase.ts`
- **Database Service**: `customerweb/src/services/database.ts`
- **Supabase Config**: `customerweb/src/config/supabase.ts`
- **Menu Page**: `customerweb/src/pages/MenuPage.tsx`
- **Table Selection**: `customerweb/src/pages/TableSelectionPage.tsx`
- **Payment Page**: `customerweb/src/pages/PaymentPage.tsx`

### Main Application:
- **Orders Screen**: `app/manager/orders.tsx`
- **Tables Screen**: `app/manager/tables.tsx`
- **Database Service**: `services/database.ts`
- **Supabase Hook**: `hooks/useSupabase.ts`
