import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

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

// 48 hours in milliseconds
const INACTIVITY_LIMIT = 48 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'last_activity_timestamp';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const appState = useRef(AppState.currentState);

    const updateLastActivity = async () => {
        try {
            await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        } catch (e) {
            console.error('Failed to save last activity', e);
        }
    };

    const checkInactivity = async () => {
        try {
            const lastActivityStr = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
            if (lastActivityStr) {
                const lastActivity = parseInt(lastActivityStr, 10);
                const now = Date.now();
                if (now - lastActivity > INACTIVITY_LIMIT) {
                    console.log('⏳ Session expired due to inactivity (48h+). Logging out.');
                    await signOut();
                    return true; // Expired
                }
            }
            // If valid or first run, update activity
            await updateLastActivity();
            return false; // Not expired
        } catch (e) {
            console.error('Error checking inactivity', e);
            return false;
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            // First check inactivity
            const isExpired = await checkInactivity();
            if (isExpired) {
                setLoading(false);
                return;
            }

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
                        await updateLastActivity(); // Refresh on successful session fetch
                    }
                }
            } catch (error) {
                console.error('Unexpected error during session check:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for app state changes (Background <-> Foreground)
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground
                console.log('App active, checking inactivity...');
                checkInactivity();
            } else if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                // App is leaving the foreground; mark last activity now.
                updateLastActivity();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
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
                await updateLastActivity(); // Set timestamp on sign in
            }
        }

        return result;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserData(null);
        await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
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

