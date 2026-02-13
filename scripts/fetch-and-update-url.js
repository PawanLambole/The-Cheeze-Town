
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Fetching Latest Build URL ---');

// Execute EAS command directly
exec('eas build:list --platform android --limit 1 --json --non-interactive', { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error executing EAS:', error);
        return;
    }

    try {
        let content = stdout.toString();

        // Find JSON array
        const jsonStart = content.indexOf('[');
        const jsonEnd = content.lastIndexOf(']');

        if (jsonStart === -1 || jsonEnd === -1) {
            console.error('❌ No JSON found in output.');
            console.log('Raw Output:', content.substring(0, 200) + '...');
            return;
        }

        const jsonString = content.substring(jsonStart, jsonEnd + 1);
        const builds = JSON.parse(jsonString);

        if (!builds.length) throw new Error('No builds found.');

        const latestBuild = builds[0];
        const buildUrl = latestBuild.artifacts?.buildUrl;
        const versionCode = parseInt(latestBuild.appBuildVersion, 10);

        console.log(`Found Build: Version ${versionCode}`);

        if (!buildUrl) {
            console.error('❌ Build URL is null. Build might not be fully finished processing artifacts.');
            return;
        }

        console.log(`URL: ${buildUrl}`);

        // Update Supabase
        const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

        supabase.from('app_versions')
            .update({ download_url: buildUrl })
            .eq('version_code', 112)
            .then(({ error }) => {
                if (error) console.error('❌ DB Update Error:', error);
                else console.log('✅ Database updated successfully.');
            });

    } catch (e) {
        console.error('❌ Parse/Update Error:', e);
    }
});
