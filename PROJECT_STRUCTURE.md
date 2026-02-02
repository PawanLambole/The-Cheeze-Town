# The Cheeze Town - Project Blueprint

## 🏗️ Architecture Overview

**The Cheeze Town** is a React Native application built with **Expo** and backed by **Supabase**. It is designed to manage restaurant operations with distinct user roles.

### Core Technologies
-   **Frontend**: React Native (Expo SDK 52)
-   **Routing**: Expo Router (File-based routing)
-   **Backend / Database**: Supabase (PostgreSQL)
-   **Realtime**: Supabase Realtime (Subscription to database changes)
-   **Notifications**: Expo Notifications + Supabase Edge Functions
-   **Styling**: Custom Theme Constants (`@/constants/Theme`)

---

## 📂 Directory Structure

```graphql
The Cheeze Town/
├── app/                        # Expo Router Pages (Screens)
│   ├── +not-found.tsx          # 404 Screen
│   ├── _layout.tsx             # Root Layout (Providers setup)
│   ├── index.tsx               # Entry Point (Redirects based on Auth)
│   ├── login/                  # Login Screen
│   ├── chef/                   # 👩‍🍳 Chef Dashboard & Routes
│   │   ├── _layout.tsx         # Chef Tab Navigation
│   │   ├── index.tsx           # Main Kitchen Display System (KDS)
│   │   └── settings.tsx        # Chef Settings
│   ├── manager/                # 👔 Manager Dashboard & Routes
│   │   ├── _layout.tsx         # Manager Tab Navigation
│   │   ├── index.tsx           # Manager Overview
│   │   ├── orders.tsx          # Active Order Management
│   │   ├── create-order.tsx    # POS / Taking Interface
│   │   ├── menu.tsx            # Menu Management
│   │   ├── staff.tsx           # Staff Management
│   │   ├── tables.tsx          # Table Management
│   │   └── ... (Billing, Inventory, Revenue, etc.)
│   └── owner/                  # 🕶️ Owner Dashboard (Super Admin)
│       ├── _layout.tsx
│       ├── index.tsx           # Business Overview
│       ├── offers/             # Managing Offers/Discounts
│       └── ... (Full access to all Manager features)
│
├── components/                 # Reusable UI Components
│   ├── common/                 # Generic (Buttons, Inputs, Cards)
│   ├── specific/               # Feature-specific (MenuGrid, OrderCard)
│   └── OrderNotificationBanner.tsx # In-app notification popup
│
├── constants/                  # App Constants
│   ├── Colors.ts               # Color Palette
│   └── Theme.ts                # Application Theme
│
├── contexts/                   # React Contexts (Global State)
│   ├── AuthContext.tsx         # User Authentication & Role Logic
│   ├── CartContext.tsx         # Shopping Cart State
│   ├── NotificationSettingsContext.ts # User preferences for alerts
│   └── OrderNotificationContext.tsx # Incoming Order Handling
│
├── hooks/                      # Custom React Hooks
│   ├── useColorScheme.ts
│   └── ...
│
├── scripts/                    # Utility Scripts
│   ├── test-push.js            # DB Trigger Notification Test
│   └── test-notification-direct.js # Direct Edge Function Test
│
├── services/                   # Business Logic & API
│   ├── database.ts             # Supabase Client Wrapper
│   └── NotificationService.ts  # Push Notification Config (Channels, Registration)
│
├── supabase/                   # Backend Configuration
│   ├── functions/              # Edge Functions (Deno/TypeScript)
│   │   └── order-notification/ # Sends Expo Push Notifications
│   └── migrations/             # Database Schema & Triggers
│
├── assets/                     # Images, Fonts, Sounds
│   └── ...
├── app.json                    # Expo Configuration
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 🔑 Key Features & Flows

### 1. Authentication & Role Management
-   **Context**: `AuthContext.tsx`
-   **Logic**: Handles Login/Logout, persists session, and checks User Role (`chef`, `manager`, `owner`).
-   **Permissions**: `app/_layout.tsx` gates access to routes based on these roles.

### 2. Order Management (Realtime)
-   **Flow**:
    1.  **Creation**: Manager/Owner creates order in `create-order.tsx` -> Inserts into `orders` table.
    2.  **Notification**: DB Trigger fires -> Calls Edge Function -> Sends Push Notification to Chef/Manager.
    3.  **Realtime**: Chef's Dashboard (`chef/index.tsx`) subscribes to `orders` table changes via Supabase Realtime to update UI instantly without refresh.

### 3. Notifications System
-   **Client**: `NotificationService.ts` manages Android Channels (Priority/Importance) and token registration.
-   **Server**: Supabase Edge Function (`order-notification`) acts as the secure sender calling Expo's Push API.
-   **Triggers**: Postgres Triggers (`supabase/migrations`) watch for `INSERT` on `orders` and `order_items`.

### 4. Inventory & Menu
-   **Menu**: Stored in `menu_items` and `categories`. Managers edit this to update the POS.
-   **Inventory**: Tracks stock levels. (Implementation in `inventory/` and `manager` screens).

---

## 🛠️ Configuration Details

-   **Database**: Supabase (Tables: `users`, `orders`, `order_items`, `menu_items`, `tables`, `payments`).
-   **Push Notifications**:
    -   Channel ID: `Orders_v4` (Reset to MAX importance on boot).
    -   Shared Secret: Used to authenticate DB Trigger <-> Edge Function.
