/**
 * Simple Migration Application Script
 * Executes SQL migration directly via Supabase Management API
 */

const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU4NzIyNSwiZXhwIjoyMDUwMTYzMjI1fQ.9iV5ioLiWZ-P8XB4sVB4zmjhXc-rU-PIDzf9D-9Ezpw';

const sql = `
-- App version management tables
CREATE TABLE IF NOT EXISTS public.app_versions (
  id SERIAL PRIMARY KEY,
  version_name TEXT NOT NULL UNIQUE,
  version_code INTEGER NOT NULL UNIQUE,
  runtime_version TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'all')),
  update_type TEXT NOT NULL CHECK (update_type IN ('ota', 'native')),
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_url TEXT,
  release_notes TEXT,
  update_message TEXT,
  min_supported_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_version_name TEXT NOT NULL,
  current_version_code INTEGER NOT NULL,
  min_supported_version_name TEXT NOT NULL,
  min_supported_version_code INTEGER NOT NULL,
  force_update_enabled BOOLEAN DEFAULT false,
  update_check_interval_hours INTEGER DEFAULT 24,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_config (
  current_version_name, current_version_code,
  min_supported_version_name, min_supported_version_code
) VALUES ('1.0.0', 100, '1.0.0', 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_versions (
  version_name, version_code, runtime_version, platform,
  update_type, is_mandatory, release_notes, update_message
) VALUES (
  '1.0.0', 100, '1.0.0', 'all', 'native', false,
  'Initial release', 'Welcome to The Cheese Town!'
) ON CONFLICT (version_name) DO NOTHING;
`;

console.log('📝 Copy and paste this SQL into Supabase SQL Editor:');
console.log('🔗 https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola/sql');
console.log('\n' + '='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\n✅ After running the SQL, the update system will be fully functional!');
