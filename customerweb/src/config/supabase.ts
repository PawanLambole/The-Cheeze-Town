import { createClient } from '@supabase/supabase-js';

// Supabase Configuration for Customer Website
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_l2p6m13fqhlAC4unPTnulg_gK69Qict';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase configuration missing! Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // Customer web doesn't need session persistence
    }
});

export const db = supabase;

export async function testConnection() {
    try {
        const { error } = await supabase.from('menu_items').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}
