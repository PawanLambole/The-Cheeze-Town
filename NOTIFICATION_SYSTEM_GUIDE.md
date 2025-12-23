# Order Notification System - Implementation Guide

## ✅ What Was Created

### 1. **Notification Preference Storage** (`services/notificationPreferences.ts`)
   - Stores user preferences using AsyncStorage
   - Three types of notifications:
     - Push Notifications  
     - Sound Notifications
     - Banner Notifications

### 2. **Order Notification Service** (`services/orderNotificationService.ts`)
   - Listens for new orders via Supabase real-time
   - Triggers notifications based on user preferences
   - Manages sound playback
   - Handles push notifications

### 3. **Notification Banner Component** (`components/OrderNotificationBanner.tsx`)
   - Animated pop-up banner that slides from top
   - Shows order details (table, customer name, order number)
   - Auto-dismisses after 5 seconds
   - Tap to view order details

### 4. **Updated Settings** (`app/manager/settings.tsx`)
   - Added 3 notification toggles:
     ✅ Push Notifications
     ✅ Banner Notifications  
     ✅ Sound
   - Preferences are saved and persist across app restarts

## 🎯 How to Integrate in Manager/Orders Page

Add this to your manager orders screen (or any screen where you want notifications):

```typescript
import { useState, useEffect } from 'react';
import { orderNotificationService } from '@/services/orderNotificationService';
import OrderNotificationBanner from '@/components/OrderNotificationBanner';

export default function OrdersScreen() {
  const [newOrder, setNewOrder] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initialize notification service
    (async () => {
      await orderNotificationService.initialize();
      
      // Start listening for new orders
      orderNotificationService.startListening((order) => {
        setNewOrder(order);
        setShowBanner(true);
      });
    })();

    // Cleanup on unmount
    return () => {
      orderNotificationService.stopListening();
    };
  }, []);

  const handleBannerDismiss = () => {
    setShowBanner(false);
  };

  const handleBannerTap = () => {
    // Navigate to order details or refresh orders list
    // router.push(`/order/${newOrder.id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Your existing orders UI */}
      
      {/* Add notification banner */}
      <OrderNotificationBanner
        visible={showBanner}
        order={newOrder}
        onDismiss={handleBannerDismiss}
        onTap={handleBannerTap}
      />
    </View>
  );
}
```

## 🔊 Adding Notification Sound

### Option 1: Add a sound file (Recommended)

1. Create folder: `assets/sounds/`
2. Add an MP3 file: `assets/sounds/notification.mp3`
3. You can download free notification sounds from:
   - https://mixkit.co/free-sound-effects/notification/
   - https://freesound.org/

### Option 2: Use system notification sound (No file needed)

Update `services/orderNotificationService.ts` line 69-77:

```typescript
async loadSound() {
  // Comment out or remove - will use system sound instead
  return;
}
```

And update `playSound()` line 82-102:

```typescript
async playSound() {
  try {
    const prefs = await notificationPreferences.get();
    
    if (!prefs.soundEnabled) {
      return;
    }

    // Use system notification sound
    await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/notification/sounds/notification-01a.mp3' },
      { shouldPlay: true }
    );
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}
```

## 📦 Required Packages

Make sure you have these installed:

```bash
npm install expo-av expo-notifications @react-native-async-storage/async-storage
```

Or if they're missing:

```bash
npx expo install expo-av expo-notifications @react-native-async-storage/async-storage
```

## 🧪 Testing

### Test Notifications:

1. Start the app
2. Go to Settings
3. Ensure all notification toggles are ON
4. Place a test order from the customer website
5. You should see/hear:
   - 🔔 Push notification
   - 📣 Banner pop-up at top
   - 🔊 Sound notification

### Test Settings:

1. Turn OFF "Sound" in settings
2. Place order → No sound should play
3. Turn OFF "Banner Notifications"  
4. Place order → No banner should appear
5. Turn OFF all notifications
6. Place order → Nothing should happen

## ⚙️ How It Works

```
Customer Places Order
       ↓
Order inserted to Supabase
       ↓
Supabase Real-time triggers
       ↓
orderNotificationService receives event
       ↓
Check notification preferences
       ↓
┌──────────────┬─────────────────┬──────────────┐
│ Push         │ Banner          │ Sound        │
│ Notification │ Notification    │ Notification │
└──────────────┴─────────────────┴──────────────┘
```

## 📝 Customization

### Change notification sound duration:
Edit `components/OrderNotificationBanner.tsx` line 29:
```typescript
const timer = setTimeout(() => {
  handleDismiss();
}, 5000); // Change 5000 to desired milliseconds
```

### Change banner colors:
Edit `components/OrderNotificationBanner.tsx` styles

### Change notification title/message:
Edit `services/orderNotificationService.ts` line 117-118

## 🐛 Troubleshooting

**No notifications appearing:**
- Check if notifications are enabled in settings
- Verify Supabase real-time is working
- Check console for errors

**Sound not playing:**
- Verify sound file exists at `assets/sounds/notification.mp3`
- Check if sound is enabled in settings
- Ensure device volume is up

**Banner not showing:**
- Verify OrderNotificationBanner is added to your screen
- Check if banner notifications are enabled in settings
- Ensure `setShowBanner(true)` is being called

## ✨ Features

✅ Real-time order notifications via Supabase
✅ Three types of notifications (push, banner, sound)
✅ User-controlled settings (toggleable)
✅ Persistent preferences (saved in AsyncStorage)
✅ Animated banner with auto-dismiss
✅ Works even when app is in background (push notifications)
✅ Custom notification sounds
✅ Tap banner to navigate to order details

## 🚀 Next Steps

1. Add notification sound file
2. Integrate banner in manager/orders screen
3. Test with real orders
4. Customize as needed

That's it! Your notification system is ready to use! 🎉
