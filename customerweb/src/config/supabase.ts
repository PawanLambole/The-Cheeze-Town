import { createClient } from '@supabase/supabase-js';

// Supabase configuration - connecting to the same database as the mobile app
const SUPABASE_URL = 'https://hncahlshvismwagbcryi.supabase.co';
const SUPABASE_ANON_KEY = 'REDACTED_JWT';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Export database instance for direct table access
export const db = supabase;

// Test connection function
export async function testConnection() {
    try {
        const { error } = await supabase
            .from('menu_items')
            .select('count')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            console.error('Database connection error:', error);
            return false;
        }

        console.log('✅ Customer Web - Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Customer Web - Database connection error:', error);
        return false;
    }
}
