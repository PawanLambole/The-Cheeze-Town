# App Update System Implementation Guide

## Overview
The app update system has been implemented with support for both:
- **OTA (Over-The-Air) Updates**: Quick JavaScript/UI updates pushed via Expo Updates
- **Native Updates**: Full APK downloads for updates that require native code changes

## Components Created

### 1. Database Schema (`supabase/migrations/20251227000000_create_app_versions.sql`)
- `app_versions` table: Tracks all app versions
- `app_config` table: Stores current app configuration
- RLS policies for public read access
- Helper functions: `get_latest_version()` and `check_update_required()`

### 2. Services
- `services/updateService.ts`: Core update checking and management logic

### 3. UI Components
- `components/UpdateDialog.tsx`: Beautiful, modern update dialog
- `contexts/UpdateContext.tsx`: Global update state management

### 4. Configuration
- `eas.json`: EAS Build and Update configuration
- `app.json`: Runtime version and update settings updated

## Setup Instructions

### Step 1: Apply Database Migration

You need to apply the SQL migration to your Supabase database. Choose one of these methods:

#### Option A: Using Supabase Web UI (Recommended)
1. Go to https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of `supabase/migrations/20251227000000_create_app_versions.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the migration

#### Option B: Using Supabase CLI
```bash
# Make sure you're logged in
npx supabase login

# Link to your project
npx supabase link --project-ref gnpdhisyxwqvnjleyola

# Push migrations
npx supabase db push
```

### Step 2: Verify Migration

Run this SQL query in Supabase to verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('app_versions', 'app_config');
```

You should see both tables listed.

### Step 3: Update Database Types (Optional but Recommended)

To get full TypeScript support, generate updated database types:

```bash
npx supabase gen types typescript --project-id gnpdhisyxwqvnjleyola > types/database.ts
```

This will update the TypeScript types to include the new tables and functions.

## How It Works

### Automatic Update Checking

The `UpdateProvider` automatically checks for updates:
- **On app mount** (after 2-second delay)
- **When app resumes** (comes back from background)
- **Respects check intervals** (default: 24 hours)

### Update Flow

1. App checks Supabase for available updates
2. If update available:
   - Shows update dialog with version info
   - User can update now or dismiss (if not mandatory)
   - For OTA updates: Downloads and applies immediately
   - For Native updates: Opens download URL for APK

### Mandatory Updates

When an update is marked as mandatory:
- Dialog cannot be dismissed
- App forces user to update before continuing
- Useful for critical bug fixes or security updates

## Publishing Updates

### OTA Updates (JavaScript/UI changes only)

```bash
# Build and publish to preview channel
eas update --branch preview --message "Your update message"

# Build and publish to production channel
eas update --branch production --message "Your update message"
```

Then update Supabase:
```sql
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
  '1.0.1',
  101,
  '1.0.0',  -- Must match app.json runtimeVersion
  'all',
  'ota',
  false,
  'Bug fixes and performance improvements',
  'A new update with bug fixes is available!'
);

UPDATE app_config SET
  current_version_name = '1.0.1',
  current_version_code = 101
WHERE id = 1;
```

### Native Updates (APK changes)

1. Update version in app.json:
```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

2. Update version in package.json if needed

3. Build APK:
```bash
eas build --platform android --profile production
```

4. Download the APK from EAS and upload it to your hosting (e.g., website, cloud storage)

5. Update Supabase with the new version:
```sql
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
  '1.1.0',
  110,
  '1.1.0',
  'android',
  'native',
  true,  -- Mandatory if breaking changes
  'https://your-website.com/downloads/app-v1.1.0.apk',
  'Major update with new features',
  'A major update is available with exciting new features!'
);

UPDATE app_config SET
  current_version_name = '1.1.0',
  current_version_code = 110,
  min_supported_version_code = 110  -- Force update
WHERE id = 1;
```

## Runtime Version Rules

- **Same runtime version**: OTA updates work
- **Different runtime version**: Native update required
- Increment runtime version when:
  - Adding/removing native dependencies
  - Changing native code
  - Updating Expo SDK
  - Changing permissions

## Testing Updates

### Test in Development

The update system is disabled in development mode by default. To test:

1. Build a preview APK:
```bash
eas build --platform android --profile preview
```

2. Install on a device

3. Add a test update in Supabase

4. Open the app to trigger update check

### Manual Update Check

You can also add a manual update check button in your app:

```typescript
import { useUpdate } from '@/contexts/UpdateContext';

function SettingsScreen() {
  const { checkForUpdate, isCheckingUpdate } = useUpdate();
  
  return (
    <TouchableOpacity
      onPress={checkForUpdate}
      disabled={isCheckingUpdate}
    >
      <Text>Check for Updates</Text>
    </TouchableOpacity>
  );
}
```

## Version Code Convention

Use a simple numeric scheme:
- 1.0.0 → 100
- 1.0.1 → 101
- 1.1.0 → 110
- 1.2.3 → 123
- 2.0.0 → 200

## Maintenance Mode

You can enable maintenance mode to show a message to all users:

```sql
UPDATE app_config SET
  maintenance_mode = true,
  maintenance_message = 'We are performing maintenance. Please check back soon!'
WHERE id = 1;
```

## Troubleshooting

### Users not seeing updates

1. Check that the migration was applied correctly
2. Verify app_config table has correct version info
3. Check that app_versions has active version
4. Verify RLS policies are set correctly

### OTA update not applying

1. Ensure runtime versions match
2. Check EAS update was published to correct channel
3. Verify app.json updates.url is correct

### TypeScript errors

If you see TypeScript errors after implementation:
1. Apply the database migration first
2. Generate new types with `npx supabase gen types`
3. Or the @ts-ignore comments will handle it temporarily

## Next Steps

1. Apply the database migration (see Step 1 above)
2. Test the update flow manually
3. Build and publish your first update
4. Monitor update adoption in Supabase

## Support

For issues or questions:
- Check Expo Updates docs: https://docs.expo.dev/versions/latest/sdk/updates/
- Check EAS Build docs: https://docs.expo.dev/build/introduction/
- Review Supabase RLS policies if users can't check updates
