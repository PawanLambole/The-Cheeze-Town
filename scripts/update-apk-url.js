
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDY4MSwiZXhwIjoyMDgyMDgwNjgxfQ.TpN6iRbVHyagqvEBJioMz2cfSxbBj0fFuQYUhCKYAac";

// Extracted from previous EAS output
const NEW_APK_URL = 'https://expo.dev/artifacts/eas/dLXiyRg6E1jiqNRanzYNsL.apk';
const VERSION_CODE = 111;

console.log(`--- Updating Version ${VERSION_CODE} URL ---`);
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function update() {
    const { error } = await supabase
        .from('app_versions')
        .update({ download_url: NEW_APK_URL })
        .eq('version_code', VERSION_CODE);

    if (error) {
        console.error('❌ Error updating URL:', error);
    } else {
        console.log('✅ Download URL updated successfully:');
        console.log(NEW_APK_URL);
    }
}

update();
