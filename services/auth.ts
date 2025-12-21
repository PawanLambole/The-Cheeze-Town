import { supabase } from '@/config/supabase';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get current session
 */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

/**
 * Refresh session
 */
export async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    return { session: data.session, error };
}

/**
 * Sign up new user (for admin use)
 */
export async function signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });

    return { data, error };
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    return { data, error };
}
