
# App Deployment & Update Rules

1. **Version Synchronization**: Before any update, ensure the version number is identical across:
   - `package.json`
   - `app.config.js` / `.env`
   - Supabase `app_versions` table

2. **Automatic Updates**: 
   - Prefer automatic (OTA) updates for JS-only changes.
   - Ensure the `app_versions` table is updated so the app detects the new version and shows "Up to date".

3. **Post-Update Verification**:
   - Verify the update is published.
   - Confirm the app will reflect the new version string.
