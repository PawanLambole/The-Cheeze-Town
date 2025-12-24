import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration (Expo)
// Values are provided via EXPO_PUBLIC_* env vars
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gnpdhisyxwqvnjleyola.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_l2p6m13fqhlAC4unPTnulg_gK69Qict';

// Debug logging
console.log('🔧 Supabase Config:');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
console.log('Key length:', SUPABASE_ANON_KEY.length);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
