import { createClient } from '@supabase/supabase-js';

// Supabase configuration - connecting to the same database as the mobile app
const SUPABASE_URL = 'https://hncahlshvismwagbcryi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2FobHNodmlzbXdhZ2JjcnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzI3MjksImV4cCI6MjA1MDAwODcyOX0.vGkQyuWcVL1LvYM9HgG9pg_aeKgha2A';

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
        const { data, error } = await supabase
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
