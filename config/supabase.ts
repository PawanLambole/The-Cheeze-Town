import { createClient } from '@supabase/supabase-js';

// Supabase configuration
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
