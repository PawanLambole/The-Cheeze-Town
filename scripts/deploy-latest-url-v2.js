
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for full access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Deploying Latest Build URL (v2) ---');

try {
    const buffer = fs.readFileSync('temp_build_info.json');
    let content = buffer.toString('utf8');

    // Robust JSON extraction: Find first '['
    const jsonStart = content.indexOf('[');
    if (jsonStart === -1) {
        throw new Error('No JSON array start found in file');
    }
    const jsonEnd = content.lastIndexOf(']');
    if (jsonEnd === -1) {
        throw new Error('No JSON array end found in file');
    }

    const jsonString = content.substring(jsonStart, jsonEnd + 1);
    const builds = JSON.parse(jsonString);

    if (!Array.isArray(builds) || builds.length === 0) {
        throw new Error('No builds parsed from JSON.');
    }

    const latestBuild = builds[0];
    const buildUrl = latestBuild.artifacts?.buildUrl;
    const versionCode = parseInt(latestBuild.appBuildVersion, 10);

    if (!buildUrl) {
        throw new Error('No buildUrl found in latest build record.');
    }

    console.log(`Found Build: Version ${versionCode}`);
    console.log(`URL: ${buildUrl}`);

    // Update Supabase
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    async function update() {
        // We update for version 112 specifically as that's our target fix
        // But let's also update whatever version code this build IS, just in case

        if (versionCode !== 112) {
            console.warn(`⚠️ Warning: Build version is ${versionCode}, but we expected 112 via publish script.`);
        }

        const { error } = await supabase
            .from('app_versions')
            .update({ download_url: buildUrl })
            .eq('version_code', versionCode);

        if (error) {
            console.error('❌ Error updating DB:', error);
        } else {
            console.log(`✅ Database updated successfully for version ${versionCode}.`);
        }
    }

    update();

} catch (error) {
    console.error('❌ Failed:', error.message);
}
