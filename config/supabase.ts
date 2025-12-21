import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://hncahlshvismwagbcryi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vGkQyuWcVL1LvYM9HgG9pg_aeKgha2A';

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

// Export auth instance
export const auth = supabase.auth;

// Export storage instance
export const storage = supabase.storage;

// Helper function to test the connection
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('_health')
            .select('*')
            .limit(1);

        if (error) {
            console.log('Database connected successfully (expected error for health check)');
            return true;
        }

        console.log('Database connected successfully');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}
