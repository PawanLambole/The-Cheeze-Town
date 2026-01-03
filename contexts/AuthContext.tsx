import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/config/supabase';

export interface AppUser {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    phone: string | null;
}

interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    userData: AppUser | null;
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: userResult } = await supabase.auth.getUser();

                if (userResult.user) {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('id, email, name, role, phone')
                        .eq('id', userResult.user.id)
                        .maybeSingle();

                    if (error) {
                        console.error('Error fetching user profile:', error);
                    }

                    if (profile) {
                        setUserData(profile as AppUser);
                    }
                }
            } catch (error: any) {
                console.error('Session check error:', error);

                // Handle invalid refresh token specifically
                if (error?.message?.includes('Refresh Token Not Found') ||
                    error?.name === 'AuthApiError' ||
                    JSON.stringify(error).includes('Invalid Refresh Token')) {
                    console.log('🔄 Invalid refresh token detected, signing out...');
                    await supabase.auth.signOut();
                    setUserData(null);
                }
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                // If we have a session but no userData, fetch it (e.g. after login or refresh)
                if (!userData || userData.id !== session.user.id) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('id, email, name, role, phone')
                        .eq('id', session.user.id)
                        .maybeSingle();
                    if (profile) setUserData(profile as AppUser);
                }
            } else {
                // Signed out
                setUserData(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        console.log('🔐 Attempting sign in for:', email);
        const result = await supabase.auth.signInWithPassword({ email, password });

        console.log('Auth result:', result.error ? '❌ Error: ' + result.error.message : '✅ Success');

        if (result.data?.user) {
            console.log('👤 User ID:', result.data.user.id);
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id, email, name, role, phone')
                .eq('id', result.data.user.id)
                .maybeSingle();

            console.log('Profile fetch:', profileError ? '❌ Error: ' + profileError.message : profile ? '✅ Found' : '⚠️ Not found');

            if (profile) {
                setUserData(profile as AppUser);
            }
        }

        return result;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserData(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!userData,
                loading,
                userData,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

