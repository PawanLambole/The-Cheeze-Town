import { createClient } from '@supabase/supabase-js';

// Supabase configuration - same database as the mobile app
const SUPABASE_URL = 'https://hncahlshvismwagbcryi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2FobHNodmlzbXdhZ2JjcnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjgzOTIsImV4cCI6MjA4MTkwNDM5Mn0.iTroRZEtMfNzVN2rvfQ5nIt325h3NbdvbXMOxd9tmTA';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Export database instance for direct access
export const db = supabase;

// Test the connection
export async function testConnection() {
    try {
        const { error } = await supabase
            .from('menu_items')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Database connection error:', error);
            return false;
        }

        console.log('✅ Customer Website - Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error);
        return false;
    }
}
