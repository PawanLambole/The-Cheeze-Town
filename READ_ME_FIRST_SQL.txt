┌─────────────────────────────────────────────────────────┐
│                                                         │
│     🍕 THE CHEEZE TOWN - DATABASE SETUP SQL SCRIPT     │
│                                                         │
└─────────────────────────────────────────────────────────┘

📋 WHAT THIS FILE DOES
──────────────────────────────────────────────────────────
This SQL script creates the COMPLETE database schema for
your restaurant management system, including:

  ✅ 15 Production-ready tables
  ✅ All relationships and foreign keys
  ✅ Indexes for performance
  ✅ Auto-triggers (order numbers, totals, etc.)
  ✅ Row Level Security (RLS) policies
  ✅ Sample data (menu items, tables)


🚀 HOW TO USE
──────────────────────────────────────────────────────────
1. Open Supabase Dashboard
   → https://hncahlshvismwagbcryi.supabase.co

2. Go to "SQL Editor" in left sidebar

3. Click "New Query"

4. Copy ALL content from this file (Ctrl+A, Ctrl+C)

5. Paste into the SQL Editor (Ctrl+V)

6. Click "Run" button (or press Ctrl+Enter)

7. Wait 10-20 seconds for completion

8. Verify in "Table Editor" - you should see 15 tables!


📊 TABLES CREATED (15 Total)
──────────────────────────────────────────────────────────
Core System:
  • users                 - User accounts & authentication
  • menu_categories       - Menu organization
  • menu_items            - All menu items (✅ 16 sample items)
  • restaurant_tables     - Table management (✅ 10 tables)

Order Management:
  • orders                - Customer orders
  • order_items           - Items in each order
  • payments              - Payment transactions
  • reservations          - Table reservations
  • feedback              - Customer reviews

Staff Management:
  • staff                 - Employee records
  • staff_payments        - Salaries & bonuses
  • attendance            - Daily attendance

Financial:
  • purchases             - Inventory purchases
  • inventory             - Stock management
  • expenses              - Business expenses


⚡ AUTOMATIC FEATURES
──────────────────────────────────────────────────────────
1. Order Numbers
   → Auto-generated: ORD000001, ORD000002, etc.

2. Order Totals
   → Auto-calculated from order_items

3. Timestamps
   → created_at, updated_at auto-managed

4. Inventory Status
   → Auto-updates: in-stock, low-stock, out-of-stock

5. Triggers
   → update_updated_at() on all tables


🔒 SECURITY (RLS)
──────────────────────────────────────────────────────────
Row Level Security is ENABLED on all tables with policies:

Public Access:
  ✓ Read menu items & categories

Authenticated Users:
  ✓ Full access to orders, payments, staff, inventory

Anonymous:
  ✓ View available menu items
  ✓ Submit feedback


📦 SAMPLE DATA
──────────────────────────────────────────────────────────
Menu Categories: 5
  • Pizza, Burgers, Sides, Beverages, Desserts

Menu Items: 16
  • Margherita Pizza - ₹299
  • Farmhouse Pizza - ₹349
  • Tandoori Paneer Pizza - ₹399
  • Classic Burger - ₹199
  • French Fries - ₹99
  • Coke - ₹49
  • And more...

Restaurant Tables: 10
  • Tables 1-5: Indoor (2-6 capacity)
  • Tables 6-8: Outdoor (6-8 capacity)
  • Tables 9-10: VIP (2-4 capacity)


🔧 AFTER RUNNING THE SQL
──────────────────────────────────────────────────────────
1. Verify tables in "Table Editor"

2. Test in your app:
   ```typescript
   import { database } from '@/services/database';
   
   const { data } = await database.getAll('menu_items');
   console.log('Menu items:', data?.length); // Should be 16
   ```

3. Check tables:
   ```typescript
   const { data } = await database.getAll('restaurant_tables');
   console.log('Tables:', data?.length); // Should be 10
   ```


📖 DOCUMENTATION
──────────────────────────────────────────────────────────
For detailed guides, check:
  • DATABASE_SETUP.md - Complete setup guide
  • docs/SQL_SETUP_GUIDE.md - Integration examples
  • docs/SUPABASE_SETUP.md - Full documentation
  • docs/database-examples.tsx - Code samples


⚠️ IMPORTANT NOTES
──────────────────────────────────────────────────────────
• This script is IDEMPOTENT - safe to run multiple times
• Uses "IF NOT EXISTS" to prevent duplicates
• Sample data uses "ON CONFLICT DO NOTHING"
• All foreign keys have proper CASCADE rules
• Indexes created for optimal performance


✅ CHECKLIST
──────────────────────────────────────────────────────────
□ Opened Supabase Dashboard
□ Navigated to SQL Editor
□ Copied this entire file
□ Pasted into SQL Editor
□ Clicked "Run"
□ Verified 15 tables created
□ Checked sample data (menu_items, restaurant_tables)
□ Tested connection in app
□ Started integrating with screens


🎯 WHAT'S NEXT?
──────────────────────────────────────────────────────────
After running this SQL:

1. Import database service in your components:
   import { database } from '@/services/database';

2. Use hooks for easy data fetching:
   import { useSupabaseQuery } from '@/hooks/useSupabase';

3. Start building features:
   • Chef dashboard → fetch pending orders
   • Manager screens → CRUD operations
   • Owner dashboard → analytics & reports


💡 TIPS
──────────────────────────────────────────────────────────
• Run in "SQL Editor" not "Database" section
• Copy the ENTIRE file (don't skip any parts)
• Check for "Success" messages after running
• If errors occur, check Supabase logs
• Can run multiple times safely (idempotent)


🎉 SUCCESS!
──────────────────────────────────────────────────────────
Once completed, your database is production-ready with:
  ✓ All tables and relationships
  ✓ Proper indexes for speed
  ✓ Security policies (RLS)
  ✓ Auto-generated IDs and numbers
  ✓ Sample data to start testing

Your app is ready to connect and start managing
The Cheeze Town restaurant! 🍕🍔🎉


──────────────────────────────────────────────────────────
Need help? Check the docs folder or Supabase documentation
──────────────────────────────────────────────────────────
