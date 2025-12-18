# The Cheeze Town - Café Management Application
## Complete Project Plan & Documentation

---

## 1. Application Overview

**Application Name:** The Cheeze Town
**Type:** Café Management System
**Platform:** React Native with Expo Router
**Framework:** Expo Managed Workflow
**Database:** Supabase (PostgreSQL)
**Backend:** Supabase Edge Functions
**Payment Gateway:** Razorpay

### Purpose
A comprehensive café management system designed to streamline operations for café owners and managers. The system handles menu management, order processing, table management, billing, payment processing, inventory management, and business analytics.

---

## 2. User Roles & Access Management

### 2.1 Owner Role
**Permissions:**
- Full system access
- View sales reports and analytics
- Monitor revenue and inventory status
- Manage managers (add/update/deactivate)
- View all branch data (future multi-branch support)
- Access audit logs
- Configure system settings

**Key Features:**
- Dashboard with business metrics
- Manager administration panel
- Analytics and reporting dashboard
- Revenue tracking
- Inventory overview

### 2.2 Manager Role
**Permissions:**
- Restricted access as assigned by Owner
- Manage menu items
- Create and modify orders
- Manage tables and billing
- Update inventory levels
- View daily reports
- Process payments

**Key Features:**
- Quick order creation
- Table management
- Real-time billing
- Inventory updates
- Daily sales tracking

---

## 3. Core Features & Modules

### 3.1 Menu Management
**Feature:** Complete menu item management
**Responsibilities:**
- Add new menu items
- Update existing items
- Delete items (soft delete)
- Enable/disable items
- Manage categories
- Set pricing
- Track availability

**Data Fields:**
- Item ID (unique identifier)
- Item Name
- Category
- Description
- Price
- Stock/Availability
- Status (Active/Inactive)
- Image URL
- Created/Updated timestamps

---

### 3.2 Order & Table Management
**Feature:** Complete order and table management system

#### Table Management:
- Create tables with unique table numbers
- Track table status:
  - Available (no order)
  - Occupied (order in progress)
  - Billing in progress
  - Reserved

- Table operations:
  - Assign orders to tables
  - Move orders between tables
  - Close/settle tables
  - Track dining duration

#### Order Management:
- Create new orders
- Select items from menu
- Set item quantities
- Add special notes/instructions
- Modify orders before billing
- Add/remove items in real-time
- Track order status:
  - Pending
  - Confirmed
  - In Progress
  - Ready
  - Served
  - Closed

**Order Data Fields:**
- Order ID
- Table Number
- Items (with quantities)
- Order Date/Time
- Special Instructions
- Order Status
- Manager ID (who created)
- Total Amount (before taxes/discounts)

---

### 3.3 Billing & Payment Processing
**Feature:** Complete billing and payment workflow

#### Billing Operations:
- Generate final bill from order
- Calculate subtotal
- Apply taxes (configurable rates)
- Apply discounts (optional)
- Calculate grand total
- Support multiple payment methods:
  - Cash
  - UPI
  - Card (via Razorpay)
  - Digital Wallets (via Razorpay)

#### Payment Processing:
- Process payments via Razorpay
- Real-time payment confirmation
- Webhook-based status updates
- Handle payment failures/retries
- Update order status on successful payment
- Generate receipt immediately after payment

**Bill Data Fields:**
- Bill ID
- Order ID
- Subtotal
- Tax Amount
- Discount Amount
- Grand Total
- Payment Method
- Payment Status (Pending/Success/Failed)
- Payment ID (Razorpay)
- Processed By (Manager ID)
- Bill Date/Time
- Receipt Generated (boolean)

---

### 3.4 Receipt Generation
**Feature:** Automatic receipt generation and storage

#### Receipt Components:
- Café name and details
- Bill/Receipt number
- Date and time
- Items with quantities and prices
- Tax breakdown
- Discount details
- Payment method used
- Total amount
- Receipt footer/notes

#### Storage:
- Digital receipt stored in database
- Receipt history accessible
- Receipt reprint capability
- PDF export functionality (future enhancement)

---

### 3.5 Inventory Management
**Feature:** Stock tracking and management

#### Inventory Operations:
- Track available quantity for each item
- Set low-stock thresholds
- Generate low-stock alerts
- Auto-deduct inventory on order completion
- Manual stock adjustment
- Record stock adjustments with reasons
- Track inventory history

#### Stock Tracking:
- Current quantity
- Low-stock threshold
- Last restocked date
- Supplier information (future)
- Unit cost
- Reorder quantity

**Inventory Data Fields:**
- Item ID
- Current Stock
- Minimum Threshold
- Reorder Quantity
- Last Updated
- Last Restocked
- Updated By (Manager ID)

---

### 3.6 Reports & Analytics
**Feature:** Comprehensive business reporting and analytics

#### Report Types:

1. **Sales Reports**
   - Daily sales summary
   - Weekly sales trends
   - Monthly performance
   - By payment method breakdown
   - By category breakdown

2. **Financial Reports**
   - Revenue tracking
   - Profit analysis (with cost data)
   - Discount impact
   - Tax collected

3. **Inventory Reports**
   - Stock levels
   - Low-stock items
   - Stock movement history
   - Inventory turnover

4. **Table Analytics**
   - Table occupancy rates
   - Average dining duration
   - Table utilization
   - Peak hours analysis

5. **Performance Metrics**
   - Orders per manager
   - Average bill value
   - Payment method preferences
   - Peak ordering times

---

## 4. Technology Stack

### Frontend
- **Framework:** React Native with Expo
- **Routing:** Expo Router (file-based routing)
- **Icons:** Lucide React Native
- **State Management:** React Hooks
- **Styling:** React Native StyleSheet
- **Safe Area:** React Native Safe Area Context
- **Gestures:** React Native Gesture Handler
- **Animations:** React Native Reanimated

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email/Password)
- **API:** Supabase REST API
- **Functions:** Supabase Edge Functions
- **Payment Gateway:** Razorpay

### Database Tables

#### Core Tables:
1. **users** - User accounts (email/password auth)
2. **managers** - Manager profiles linked to auth.users
3. **menu_items** - Menu items and categories
4. **tables** - Café tables configuration
5. **orders** - Customer orders
6. **order_items** - Individual items in orders
7. **bills** - Final bills and billing information
8. **payments** - Payment records with Razorpay data
9. **receipts** - Receipt storage and history
10. **inventory** - Stock tracking
11. **inventory_adjustments** - Stock adjustment history
12. **audit_logs** - System audit trail

#### Support Tables:
13. **categories** - Menu categories
14. **payment_methods** - Payment method definitions
15. **tax_rates** - Configurable tax rates
16. **branches** - Multi-branch support (future)

---

## 5. Application Structure

```
project/
├── app/
│   ├── _layout.tsx                 # Root layout with Stack navigator
│   ├── index.tsx                   # Login screen
│   └── (tabs)/
│       ├── _layout.tsx             # Tab navigator
│       ├── index.tsx               # Home/Dashboard screen
│       └── profile.tsx             # Profile screen
│
├── components/
│   ├── MenuManagement/
│   │   ├── MenuList.tsx
│   │   ├── MenuItemCard.tsx
│   │   ├── AddItemModal.tsx
│   │   └── EditItemModal.tsx
│   │
│   ├── OrderManagement/
│   │   ├── OrderCreation.tsx
│   │   ├── OrderList.tsx
│   │   ├── OrderDetailsModal.tsx
│   │   └── TableSelector.tsx
│   │
│   ├── TableManagement/
│   │   ├── TableGrid.tsx
│   │   ├── TableCard.tsx
│   │   └── TableStatusBadge.tsx
│   │
│   ├── Billing/
│   │   ├── BillGeneration.tsx
│   │   ├── BillDetails.tsx
│   │   ├── PaymentProcessor.tsx
│   │   └── RazorpayIntegration.tsx
│   │
│   ├── Inventory/
│   │   ├── InventoryList.tsx
│   │   ├── InventoryItem.tsx
│   │   ├── AdjustmentModal.tsx
│   │   └── LowStockAlert.tsx
│   │
│   ├── Reports/
│   │   ├── SalesReport.tsx
│   │   ├── InventoryReport.tsx
│   │   ├── TableAnalytics.tsx
│   │   └── ReportChart.tsx
│   │
│   ├── Common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── ConfirmDialog.tsx
│   │
│   └── Auth/
│       └── ProtectedRoute.tsx
│
├── services/
│   ├── supabase.ts               # Supabase client setup
│   ├── auth.ts                   # Authentication service
│   ├── menu.ts                   # Menu API calls
│   ├── orders.ts                 # Order API calls
│   ├── tables.ts                 # Table API calls
│   ├── billing.ts                # Billing API calls
│   ├── payments.ts               # Payment API calls
│   ├── inventory.ts              # Inventory API calls
│   ├── reports.ts                # Reports API calls
│   └── razorpay.ts               # Razorpay integration
│
├── hooks/
│   ├── useFrameworkReady.ts      # Framework initialization
│   ├── useAuth.ts                # Authentication state
│   ├── useUser.ts                # User profile
│   └── useMenuItems.ts           # Menu data fetching
│
├── types/
│   ├── index.ts                  # Type definitions
│   ├── auth.ts                   # Auth types
│   ├── menu.ts                   # Menu types
│   ├── order.ts                  # Order types
│   ├── bill.ts                   # Bill types
│   ├── inventory.ts              # Inventory types
│   └── payment.ts                # Payment types
│
├── utils/
│   ├── formatting.ts             # Number/date formatting
│   ├── validation.ts             # Input validation
│   ├── constants.ts              # App constants
│   └── helpers.ts                # Utility functions
│
├── supabase/
│   ├── functions/
│   │   ├── payment-webhook/      # Razorpay webhook handler
│   │   ├── generate-receipt/     # Receipt generation function
│   │   └── send-notification/    # Notification service
│   │
│   └── migrations/
│       ├── 001_create_users_table.sql
│       ├── 002_create_managers_table.sql
│       ├── 003_create_menu_items_table.sql
│       ├── 004_create_tables_table.sql
│       ├── 005_create_orders_table.sql
│       └── ... (more migrations)
│
├── .env                          # Environment variables
├── app.json                      # Expo configuration
├── package.json
├── tsconfig.json
└── PROJECT_PLAN.md              # This file
```

---

## 6. Current Implementation Status

### ✅ Completed (Phase 1: UI Foundation)
- [x] Login page with role selection
- [x] Home/Dashboard page with feature grid
- [x] Profile page with user information
- [x] Tab-based navigation structure
- [x] Yellow and grey theme implementation
- [x] Responsive design for mobile

### 🔄 To Be Implemented

#### Phase 2: Authentication & Core Infrastructure
- [ ] Supabase integration setup
- [ ] Email/password authentication
- [ ] User session management
- [ ] Role-based access control
- [ ] Protected routes

#### Phase 3: Menu Management
- [ ] Menu list view
- [ ] Add menu item screen
- [ ] Edit menu item screen
- [ ] Delete menu item functionality
- [ ] Category management
- [ ] Menu item search/filter

#### Phase 4: Order & Table Management
- [ ] Table grid view
- [ ] Order creation screen
- [ ] Item selection interface
- [ ] Order modification
- [ ] Table status tracking
- [ ] Order history

#### Phase 5: Billing & Payment
- [ ] Bill generation screen
- [ ] Razorpay integration
- [ ] Payment processing
- [ ] Multiple payment method support
- [ ] Payment status tracking
- [ ] Receipt generation

#### Phase 6: Inventory Management
- [ ] Inventory list view
- [ ] Stock adjustment interface
- [ ] Low-stock alerts
- [ ] Inventory history
- [ ] Auto-deduction on order

#### Phase 7: Reports & Analytics
- [ ] Sales reports
- [ ] Revenue dashboard
- [ ] Inventory reports
- [ ] Table analytics
- [ ] Chart components

#### Phase 8: Owner Features
- [ ] Manager management screen
- [ ] System settings
- [ ] Audit logs
- [ ] Branch management (future)

#### Phase 9: Backend & API
- [ ] Supabase Edge Functions
- [ ] Razorpay webhook handler
- [ ] Receipt generation API
- [ ] Notification service
- [ ] Data validation layer

#### Phase 10: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Production build
- [ ] Deployment setup

---

## 7. Database Schema Overview

### Key Relationships:
```
users (Supabase Auth)
├── managers (1:1 relationship)
└── audit_logs

managers
├── orders (1:N)
├── bills (1:N)
└── inventory_adjustments (1:N)

menu_items
├── categories (N:1)
├── order_items (1:N)
└── inventory (1:1)

tables
└── orders (1:N)

orders
├── order_items (1:N)
├── manager (N:1)
├── table (N:1)
└── bill (1:1)

order_items
├── menu_item (N:1)
└── order (N:1)

bills
├── payments (1:N)
├── receipts (1:1)
├── order (N:1)
└── manager (N:1)

payments
├── bill (N:1)
└── receipts (1:1)

inventory
└── menu_item (1:1)
```

---

## 8. Styling & Theme

### Color Palette:
- **Primary Yellow:** #FDB813
- **Secondary Grey:** #6B7280
- **Dark Grey:** #374151
- **Light Grey:** #E5E7EB
- **Background:** #F9FAFB
- **White:** #FFFFFF
- **Error:** #EF4444
- **Success:** #10B981

### Typography:
- **Heading 1:** 36px, Bold (700)
- **Heading 2:** 24px, Bold (700)
- **Heading 3:** 18px, Semi-bold (600)
- **Body:** 16px, Regular (400)
- **Small:** 14px, Regular (400)
- **Caption:** 12px, Regular (400)

### Spacing System (8px base):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 40px

---

## 9. Security Considerations

### Authentication & Authorization
- Role-based access control (RBAC)
- Secure password hashing
- Session management
- JWT token handling

### Data Security
- Row Level Security (RLS) on all tables
- Encrypted sensitive data (if needed)
- Secure API endpoints
- Input validation and sanitization

### Payment Security
- PCI DSS compliance via Razorpay
- Webhook verification
- Secure transaction handling
- No sensitive payment data storage

### Audit & Compliance
- Audit logs for all critical operations
- Transaction history tracking
- Inventory adjustment logs
- Manager activity monitoring

---

## 10. Performance & Scalability

### Optimization Strategies:
- Lazy loading of components
- Pagination for large lists
- Caching with React hooks
- Image optimization
- Database query optimization with indexes
- Offline-safe operations (future)

### Scalability Features:
- Multi-branch support (database design ready)
- Horizontal scaling via Supabase
- Edge function auto-scaling
- Progressive enhancement
- Mobile-first responsive design

---

## 11. Future Enhancements (Phase 2+)

- [ ] Offline mode with sync
- [ ] QR code table ordering (customer app)
- [ ] Mobile app for Android/iOS
- [ ] SMS notifications
- [ ] Email receipts
- [ ] Loyalty program
- [ ] Staff scheduling
- [ ] Kitchen display system
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Expense tracking
- [ ] Supplier management
- [ ] Customer feedback system
- [ ] Integration with POS machines
- [ ] Dark mode support

---

## 12. Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 13. Testing Strategy

### Unit Tests
- Service functions
- Utility functions
- Custom hooks
- Type definitions

### Integration Tests
- Authentication flow
- Order creation and billing
- Payment processing
- Inventory management

### E2E Tests (Future)
- Complete user workflows
- Login to payment
- Multi-user scenarios
- Error scenarios

---

## 14. Deployment Strategy

### Development
- Local development with Expo
- Hot reloading
- Debug mode

### Staging
- Test environment
- QA testing
- Performance testing

### Production
- Optimized build
- Error monitoring
- Analytics tracking
- Backup strategy

---

## 15. Contact & Support

**Application Name:** The Cheeze Town
**Type:** Café Management System
**Version:** 1.0.0 (In Development)
**Last Updated:** 2024

---

## Notes

This is a comprehensive plan for building a complete café management system. The UI foundation has been created with a professional yellow and grey theme. The next phase will focus on backend integration with Supabase and implementing core features like menu management, order processing, and billing systems.

All components are designed to be modular, reusable, and maintainable. The architecture follows React Native best practices and is scalable for future enhancements.
