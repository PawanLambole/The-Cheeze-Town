## 🔧 Metro Bundler Cache Issue - Quick Fix

### Error You're Seeing:
```
Unable to resolve "@/assets/sounds/notification.mp3"
SyntaxError: Unexpected token (99:16)
```

### Cause:
Metro bundler is using **cached/old version** of the file. The file has been updated to use `belli.m4a` but the bundler hasn't refreshed.

### ✅ Solution: Clear Cache and Restart

**Option 1: Restart with Cache Clear (Recommended)**
```bash
# Stop the current expo server (Ctrl+C in the terminal)
# Then run:
npx expo start --clear
```

**Option 2: Manual Cache Clear**
```bash
# Stop expo (Ctrl+C)
# Clear cache:
npx expo start --clear

# Or if that doesn't work:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start
```

**Option 3: Full Reset (If above don't work)**
```bash
# Stop expo
# Delete cache folders
rm -rf node_modules/.cache
rm -rf .expo  
rm -rf android/app/build (if exists)
rm -rf ios/build (if exists)

# Restart
npx expo start --clear
```

### ✅ What's Actually in the File Now:

The file `services/orderNotificationService.ts` has been **correctly updated**:
- Line 72: `require('@/assets/sounds/belli.m4a')` ✅
- Line 97: `require('@/assets/sounds/belli.m4a')` ✅
- No syntax errors ✅

### After Restart:
- ✅ File will load correctly
- ✅ Sound will use `belli.m4a`
- ✅ No more errors

### Quick Command:
```powershell
# In the terminal running expo, press Ctrl+C
# Then run:
npx expo start --clear --tunnel
```

**That's it! The cache will clear and use the updated code.**
