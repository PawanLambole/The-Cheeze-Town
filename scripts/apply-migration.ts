import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU4NzIyNSwiZXhwIjoyMDUwMTYzMjI1fQ.9iV5ioLiWZ-P8XB4sVB4zmjhXc-rU-PIDzf9D-9Ezpw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
    console.log('🚀 Applying app version migration...\n');

    try {
        // Create app_versions table
        console.log('📦 Creating app_versions table...');
        const { error: error1 } = await supabase.rpc('exec_sql', {
            query: `
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
      `
        });

        if (error1) {
            console.log('⚠️ Using simple table creation (exec_sql not available)\n');
            console.log('Please apply the migration manually using Supabase SQL Editor:');
            console.log('👉 https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola/sql\n');

            const sqlPath = join(process.cwd(), 'supabase', 'migrations', '20251227000000_create_app_versions.sql');
            const sql = readFileSync(sqlPath, 'utf-8');

            console.log('='.repeat(80));
            console.log(sql);
            console.log('='.repeat(80));

            return;
        }

        console.log('✅ app_versions table created\n');

        // Create app_config table
        console.log('📦 Creating app_config table...');
        await supabase.rpc('exec_sql', {
            query: `
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
      `
        });
        console.log('✅ app_config table created\n');

        console.log('🎉 Migration applied successfully!');
        console.log('✨ Update system is now ready to use!');

    } catch (error) {
        console.error('❌ Error applying migration:', error);
        console.log('\n📝 Please apply the migration manually via Supabase SQL Editor');
        console.log('👉 https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola/sql');
    }
}

applyMigration();
