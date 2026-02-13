
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
// Use Service Key for full access
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

console.log('--- Deploying Latest Build URL ---');

try {
    // Read the temp build info file (assuming UTF-16LE or similar, but fs usually handles utf8)
    // If it's UTF-16LE, we might need to handle encoding.
    // Let's try reading as buffer and converting if needed, or just utf8
    // PowerShell redirection often creates UTF-16LE with BOM.
    const buffer = fs.readFileSync('temp_build_info.json');
    let content = buffer.toString('utf8');

    // Check for BOM or null bytes (common in UTF-16 interpreted as UTF-8)
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    // Simple heuristic for UTF-16LE: check for null bytes between chars
    if (buffer.includes(0)) {
        content = buffer.toString('utf16le');
    }

    // Parse JSON (it's an array of builds)
    const builds = JSON.parse(content);

    if (!Array.isArray(builds) || builds.length === 0) {
        throw new Error('No builds found in JSON.');
    }

    const latestBuild = builds[0];
    const buildUrl = latestBuild.artifacts?.buildUrl;
    const versionCode = parseInt(latestBuild.appBuildVersion, 10);

    if (!buildUrl) {
        throw new Error('No buildUrl found in latest build.');
    }

    console.log(`Found Build: Version ${versionCode}`);
    console.log(`URL: ${buildUrl}`);

    if (versionCode !== 112) {
        console.warn(`WARNING: Latest build is version ${versionCode}, expected 112.`);
    }

    // Update Supabase
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    async function update() {
        const { error } = await supabase
            .from('app_versions')
            .update({ download_url: buildUrl })
            .eq('version_code', 112); // Always target 112 (or verify matches)

        if (error) {
            console.error('❌ Error updating DB:', error);
        } else {
            console.log('✅ Database updated successfully with new APK URL.');
        }
    }

    update();

} catch (error) {
    console.error('❌ Failed:', error.message);
}
