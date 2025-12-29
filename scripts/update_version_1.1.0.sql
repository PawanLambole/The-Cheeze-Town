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
  2,
  '1.1.0',
  'android',
  'native',
  true,
  'https://[YOUR_DOMAIN]/downloads/CheezeTown-v1.1.0.apk', -- REPLACE WITH ACTUAL DOMAIN
  'Major update including native and OTA changes.',
  'A mandatory update is available. Please install the latest version.'
);

UPDATE app_config SET
  current_version_name = '1.1.0',
  current_version_code = 2,
  min_supported_version_code = 2,
  force_update_enabled = true,
  updated_at = NOW()
WHERE id = 1;
