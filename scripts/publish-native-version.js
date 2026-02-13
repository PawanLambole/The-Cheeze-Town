
const https = require('https');

const PROJECT_REF = 'gnpdhisyxwqvnjleyola';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_69b8b1f7c761307f9e101fbc7aa58a3960460310';

const VERSION_CODE = 111;
const VERSION_NAME = '1.0.11';
const UPDATE_MESSAGE = 'Background Notifications Enabled & Multi-Device Support';

const sql = `
-- 1. Insert the new version
INSERT INTO public.app_versions (
    version_name,
    version_code,
    platform,
    update_type,
    is_mandatory,
    is_active,
    update_message,
    release_notes
) VALUES (
    '${VERSION_NAME}',
    ${VERSION_CODE},
    'android',
    'native',
    true, -- Mandatory
    true, -- Active
    '${UPDATE_MESSAGE}',
    'Added required permissions for Android 13+ notifications and multi-device support.'
) ON CONFLICT (version_code) DO UPDATE SET
    is_mandatory = EXCLUDED.is_mandatory,
    is_active = EXCLUDED.is_active,
    update_message = EXCLUDED.update_message,
    updated_at = now();

-- 2. Update App Config to enforce this version
UPDATE public.app_config
SET
    current_version_code = ${VERSION_CODE},
    current_version_name = '${VERSION_NAME}',
    min_supported_version_code = ${VERSION_CODE}, -- Everyone below this MUST update
    min_supported_version_name = '${VERSION_NAME}',
    force_update_enabled = true,
    updated_at = now()
WHERE id = 1;
`;

const data = JSON.stringify({ query: sql });

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`--- Publishing Version ${VERSION_NAME} (${VERSION_CODE}) ---`);
const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (responseBody) console.log('Response:', responseBody);
    });
});

req.on('error', (error) => console.error('Error:', error));
req.write(data);
req.end();
