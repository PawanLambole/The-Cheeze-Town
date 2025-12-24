import { supabase } from '@/config/supabase';

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}

/** Sign out current user */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/** Get current session */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

/** Get current user */
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
}

/** Refresh session (wrapper around getSession) */
export async function refreshSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

/** Sign up new user */
export async function signUp(email: string, password: string, metadata?: any) {
    return await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
    });
}

/** Reset password via email */
export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined,
    });
    return { data, error };
}

/** Update password for currently logged-in user */
export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
}
