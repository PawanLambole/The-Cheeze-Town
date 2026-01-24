import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabase';
import { notificationService } from '@/services/NotificationService';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const LOGIN_TIMESTAMP_KEY = 'auth_login_timestamp';
const SESSION_TIMEOUT_MS = 36 * 60 * 60 * 1000; // 36 hours

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
};

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

    const mountedRef = useRef(false);
    const latestProfileRequestRef = useRef(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchAndSetProfile = useCallback(async (userId: string) => {
        const requestId = ++latestProfileRequestRef.current;
        const maxAttempts = 3;
        const timeoutMs = 15000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (!mountedRef.current || requestId !== latestProfileRequestRef.current) return;

            try {
                const profilePromise = supabase
                    .from('users')
                    .select('id, email, name, role, phone')
                    .eq('id', userId)
                    .maybeSingle();

                const result = await withTimeout(
                    profilePromise as any,
                    timeoutMs,
                    'Profile fetch'
                );

                const { data: profile, error } = result as any;

                if (requestId !== latestProfileRequestRef.current || !mountedRef.current) return;

                if (error) {
                    console.error('Error fetching user profile:', error);
                    return;
                }

                if (profile) {
                    setUserData((prev) => (prev ? ({ ...prev, ...(profile as AppUser) }) : (profile as AppUser)));
                } else {
                    // Start: Profile Check Implementation
                    // User is authenticated in Auth system but has no record in 'users' table.
                    // This is an invalid state (e.g., user deleted from DB but has valid token).
                    console.warn('⚠️ User authenticated but no profile found in database. Auto-logging out.');
                    await signOut();
                    return;
                    // End: Profile Check Implementation
                }

                return;
            } catch (error: any) {
                const message = error?.message ?? '';
                const isTimeout = typeof message === 'string' && message.includes('Profile fetch timed out');

                if (isTimeout && attempt < maxAttempts) {
                    await sleep(750 * attempt * attempt);
                    continue;
                }

                // On final timeout or non-timeout errors, log once and stop.
                if (isTimeout) {
                    console.warn('Profile fetch timeout (giving up):', error);
                } else {
                    console.error('Profile fetch error:', error);
                }
                return;
            }
        }
    }, []);

    const pushTokenSyncInFlightRef = useRef(false);

    const syncChefPushToken = useCallback(async (userId: string) => {
        if (pushTokenSyncInFlightRef.current) return;
        pushTokenSyncInFlightRef.current = true;

        try {
            const token = await notificationService.registerForPushNotificationsAsync();
            if (!token) return;

            const { error } = await supabase
                .from('users')
                .update({ expo_push_token: token } as any)
                .eq('id', userId);

            if (error) {
                console.error('Failed to update push token:', error);
            } else {
                console.log('✅ Push token synced to user profile');
            }
        } catch (e) {
            console.warn('Push token sync failed:', e);
        } finally {
            pushTokenSyncInFlightRef.current = false;
        }
    }, []);

    // When profile loads and user is a chef, ensure push token is registered/synced.
    useEffect(() => {
        if (!userData?.id) return;
        if (userData.role !== 'chef') return;
        void syncChefPushToken(userData.id);
    }, [userData?.id, userData?.role, syncChefPushToken]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Start: 36-Hour Timeout Implementation
                const storedTimestamp = await AsyncStorage.getItem(LOGIN_TIMESTAMP_KEY);
                const now = Date.now();

                if (storedTimestamp) {
                    const loginTime = parseInt(storedTimestamp, 10);
                    if (now - loginTime > SESSION_TIMEOUT_MS) {
                        console.log('⏰ Session expired (exceeded 36 hours). Logging out.');
                        await signOut();
                        setLoading(false);
                        return;
                    }
                } else {
                    // If no timestamp exists but we have a session (e.g. existing user after update),
                    // start the timer now so they don't get logged out immediately.
                    await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, now.toString());
                }
                // End: 36-Hour Timeout Implementation

                // Prefer getSession() on boot: it's local storage based and avoids hanging on network.
                const { data: sessionResult, error: sessionError } = await withTimeout(
                    supabase.auth.getSession(),
                    5000,
                    'Session check'
                );

                if (sessionError) {
                    console.error('Session check error:', sessionError);
                }

                const sessionUser = sessionResult?.session?.user;

                if (sessionUser) {
                    // Allow app to proceed immediately; profile can load in background.
                    setUserData({
                        id: sessionUser.id,
                        email: sessionUser.email ?? '',
                        name: null,
                        role: null,
                        phone: null,
                    });

                    // Fetch full profile (bounded) without blocking loading.
                    void fetchAndSetProfile(sessionUser.id);
                } else {
                    setUserData(null);
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
                // Seed minimal userData quickly; then fetch profile in background.
                setUserData((prev) => prev?.id === session.user.id ? prev : ({
                    id: session.user.id,
                    email: session.user.email ?? '',
                    name: null,
                    role: null,
                    phone: null,
                }));

                void fetchAndSetProfile(session.user.id);
            } else {
                setUserData(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchAndSetProfile]);

    const signIn = async (email: string, password: string) => {
        console.log('🔐 Attempting sign in for:', email);
        const startTotal = Date.now();

        try {
            // 1. Auth Login
            console.log('⏳ Starting Supabase Auth...');
            const startAuth = Date.now();

            const result = await supabase.auth.signInWithPassword({ email, password });

            const endAuth = Date.now();
            console.log(`✅ Supabase Auth completed in ${endAuth - startAuth}ms`);

            console.log('Auth result:', result.error ? '❌ Error: ' + result.error.message : '✅ Success');

            if (result.data?.user) {
                console.log('👤 User ID:', result.data.user.id);

                // Seed minimal auth state immediately; profile loads in background.
                setUserData({
                    id: result.data.user.id,
                    email: result.data.user.email ?? email,
                    name: null,
                    role: null,
                    phone: null,
                });

                // 2. Profile Fetch
                console.log('⏳ Fetching user profile...');
                const startProfile = Date.now();

                // Start: 36-Hour Timeout Implementation
                // Set login timestamp on successful login
                await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
                // End: 36-Hour Timeout Implementation

                void fetchAndSetProfile(result.data.user.id).finally(() => {
                    const endProfile = Date.now();
                    console.log(`✅ Profile fetch finished in ${endProfile - startProfile}ms`);
                });
            }

            console.log(`🏁 Total Login Process took ${Date.now() - startTotal}ms`);
            return result;
        } catch (error: any) {
            console.error('Sign in exception:', error);
            // Return error format matching Supabase response so UI handles it
            return { data: { user: null, session: null }, error: error };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out from Supabase:', error);
        } finally {
            await AsyncStorage.removeItem(LOGIN_TIMESTAMP_KEY); // Clear timestamp on logout
            setUserData(null);
        }
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

