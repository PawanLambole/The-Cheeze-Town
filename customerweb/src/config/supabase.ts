// Supabase Config - DISABLED (Customer Web)
// This app is currently running without any external database.

console.log('⚠️ Customer Web: Supabase is disabled. Using mock data instead.');

// Keep exports for backwards compatibility, but they do nothing.
export const supabase: null = null;
export const db = supabase;

export async function testConnection() {
    // Always report "no database" but without throwing.
    console.warn('Customer Web: testConnection called, but no database is configured.');
    return false;
}
