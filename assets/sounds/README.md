# Notification Sound Placeholder

This folder should contain the notification sound file.

## Required File:
- **notification.mp3**

## Download Options:

1. **Mixkit** (Recommended - Free, No Attribution Required):
   - Visit: https://mixkit.co/free-sound-effects/notification/
   - Download: "Notification tone" or "Alert tone"
   - Rename to: `notification.mp3`
   - Place here: `assets/sounds/notification.mp3`

2. **Freesound** (Free, Creative Commons):
   - Visit: https://freesound.org/
   - Search: "notification" or "bell"
   - Download MP3 format
   - Rename to: `notification.mp3`

3. **NotificationSounds.com**:
   - Visit: https://notificationsounds.com/
   - Choose any notification sound
   - Download as MP3
   - Rename to: `notification.mp3`

## Recommendation:

Try Mixkit's "Notification 2" - it's a pleasant, professional notification sound that works well for order notifications.

Direct link: https://mixkit.co/free-sound-effects/notification/

## Alternative: Use Web URL

If you don't want to download a file, update `services/orderNotificationService.ts` to use a web URL instead. See `NOTIFICATION_SOUND_SETUP.md` for instructions.

## File Specifications:

- Format: MP3
- Duration: 0.5 - 2 seconds (recommended)
- Size: < 100KB (recommended)
- Sample Rate: 44.1kHz or 48kHz
- Bitrate: 128kbps or higher

## Once Added:

The file path will be:
```
assets/
  sounds/
    notification.mp3  ← Place your file here
```

And the code will reference it as:
```typescript
require('@/assets/sounds/notification.mp3')
```

Happy notifying! 🔔
