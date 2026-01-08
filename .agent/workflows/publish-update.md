---
description: Publish app updates (OTA and Native)
---

# App Update Publishing Workflow

This workflow guides you through publishing updates to The Cheese Town app.

## Determine Update Type

First, determine if you need an OTA or Native update:

**OTA Update** (Quick, no reinstall needed):
- JavaScript/TypeScript code changes
- UI/styling changes
- Logic/business rules changes
- Bug fixes that don't require native changes
- No new permissions needed
- No new native dependencies

**Native Update** (Full APK, user reinstalls):
- New native dependencies/libraries
- Permission changes (in app.json)
- Native code modifications
- Expo SDK version update
- Build configuration changes
- Breaking changes to runtime version

## OTA Update Workflow

### 1. Make your changes
Make the necessary code changes in your JavaScript/TypeScript files.

### 2. Test locally
```bash
# Test in development
npm start
```

### 3. Commit changes
```bash
git add .
git commit -m "feat: your feature description"
git push
```

### 4. Update version in .env (for tracking)
This repo reads version/runtimeVersion from `.env` via `app.config.js`.

Update these in your `.env` (single source of truth):
- `EXPO_PUBLIC_APP_VERSION`
- `EXPO_PUBLIC_ANDROID_VERSION_CODE` (Android build number)
- `EXPO_PUBLIC_IOS_BUILD_NUMBER` (iOS build number, if used)

### 5. Publish OTA update
```bash
// turbo
# For preview/testing
eas update --branch preview --message "Brief description of update"

# For production (when ready)
eas update --branch production --message "Brief description of update"
```

### 6. Update Supabase database

Go to Supabase SQL Editor and run:

```sql
-- Insert new version record
INSERT INTO app_versions (
  version_name,
  version_code,
  runtime_version,
  platform,
  update_type,
  is_mandatory,
  release_notes,
  update_message
) VALUES (
  'YOUR_APP_VERSION',
  YOUR_VERSION_CODE,
  'YOUR_RUNTIME_VERSION',
  'all',    -- 'android', 'ios', or 'all'
  'ota',
  false,    -- Set to true for mandatory updates
  'Bug fixes and performance improvements',
  'A new update is available!'
);

-- Update current version config
UPDATE app_config SET
  current_version_name = 'YOUR_APP_VERSION',
  current_version_code = YOUR_VERSION_CODE,
  updated_at = NOW()
WHERE id = 1;
```

### 7. Verify update
- Open the app on a device (not development mode)
- The update should be detected and applied
- Or wait for automatic check interval (24 hours by default)

---

## Native Update Workflow

### 1. Make your changes
Make the necessary code/configuration changes.

### 2. Update version numbers

This repo uses `.env` as the single source of truth for versioning (via `app.config.js`).

Update these in your `.env`:
- `EXPO_PUBLIC_APP_VERSION` (drives both `expo.version` and `expo.runtimeVersion`)
- `EXPO_PUBLIC_ANDROID_VERSION_CODE` (Android `versionCode`)
- `EXPO_PUBLIC_IOS_BUILD_NUMBER` (iOS `buildNumber`, if used)

### 3. Test locally
```bash
npm start
```

### 4. Commit changes
```bash
git add .
git commit -m "feat: your feature description"
git push
```

### 5. Build APK
```bash
// turbo
# For preview/testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

This will take 5-15 minutes. Wait for the build to complete.

### 6. Download APK
After build completes:
1. Go to https://expo.dev/accounts/[your-account]/projects/the-cheese-town/builds
2. Download the APK
3. Upload it to your hosting (website, cloud storage, etc.)
4. Get the public download URL

### 7. Update Supabase database

Go to Supabase SQL Editor and run:

```sql
-- Insert new version record
INSERT INTO app_versions (
  version_name,
  version_code,
  runtime_version,
  platform,
  update_type,
  is_mandatory,
  download_url,
  release_notes,
  update_message
) VALUES (
  'YOUR_APP_VERSION',
  YOUR_VERSION_CODE,
  'YOUR_RUNTIME_VERSION',
  'android',
  'native',
  true,  -- Usually true for native updates
  'https://your-domain.com/downloads/cheeze-town-vYOUR_APP_VERSION.apk',
  'Major update with new features and improvements',
  'A major update is available! Please download and install.'
);

-- Update current version config and force update
UPDATE app_config SET
  current_version_name = 'YOUR_APP_VERSION',
  current_version_code = YOUR_VERSION_CODE,
  min_supported_version_code = YOUR_VERSION_CODE,  -- Force users below this to update
  force_update_enabled = true,
  updated_at = NOW()
WHERE id = 1;
```

### 8. Test update flow
1. Install the OLD APK version on a test device
2. Open the app
3. You should see the update dialog
4. Test the download and installation process

### 9. Distribute
Share the update with users:
- Notify users through in-app notifications
- Post update announcement
- The app will automatically detect and prompt for update

---

## Quick Reference

### Version Code Scheme
```
1.0.0 → 100
1.0.1 → 101
1.1.0 → 110
1.2.3 → 123
2.0.0 → 200
```

### Update Type Decision Tree
```
Did you change native dependencies? → YES → Native Update
Did you change permissions? → YES → Native Update
Did you change app.json build config? → YES → Native Update
Did you update Expo SDK? → YES → Native Update
Only changed JS/TS files? → YES → OTA Update
```

### EAS Commands
```bash
# View builds
eas build:list

# View updates
eas update:list --branch production

# Delete update
eas update:delete [update-id]

# Configure EAS
eas update:configure
```

### Check Current App Version
```sql
SELECT * FROM app_config;
SELECT * FROM app_versions ORDER BY version_code DESC LIMIT 5;
```

### Enable Maintenance Mode
```sql
UPDATE app_config SET
  maintenance_mode = true,
  maintenance_message = 'We are performing maintenance. Please try again in 30 minutes.'
WHERE id = 1;
```

### Disable Maintenance Mode
```sql
UPDATE app_config SET
  maintenance_mode = false,
  maintenance_message = NULL
WHERE id = 1;
```

---

## Rollback

### Rollback OTA Update
```bash
// turbo
# Publish a previous version
eas update --branch production --message "Rollback to stable version"
```

### Rollback Native Update
```sql
-- Point config back to previous version
UPDATE app_config SET
  current_version_name = '1.0.0',
  current_version_code = 100,
  min_supported_version_code = 100
WHERE id = 1;

-- Mark new version as inactive
UPDATE app_versions SET
  is_active = false
WHERE version_code = 110;
```

---

## Monitoring

### Check update adoption
```sql
-- View all versions
SELECT 
  version_name,
  version_code,
  update_type,
  is_mandatory,
  created_at
FROM app_versions
ORDER BY version_code DESC;

-- Check current config
SELECT * FROM app_config;
```

## Notes

- Always test updates on a non-production build first
- Keep version codes sequential and never reuse them
- Document breaking changes in release notes
- Use mandatory updates sparingly (critical fixes only)
- Monitor user feedback after updates
