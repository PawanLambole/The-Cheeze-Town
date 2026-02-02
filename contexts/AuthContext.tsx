import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabase';
import { notificationService } from '@/services/NotificationService';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const LOGIN_TIMESTAMP_KEY = 'auth_last_active_timestamp';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    const pushTokenSyncInFlightRef = useRef(false);

    // Keep strict track of user ID for logout cleanup without stale closures
    const userIdRef = useRef<string | null>(null);
    useEffect(() => { userIdRef.current = userData?.id || null; }, [userData?.id]);

    const signOut = useCallback(async () => {
        try {
            const currentUserId = userIdRef.current;
            if (currentUserId) {
                console.log('🧹 Clearing push token for user:', currentUserId);
                await supabase.from('users').update({ expo_push_token: null } as any).eq('id', currentUserId);
            }
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out from Supabase:', error);
        } finally {
            await AsyncStorage.removeItem(LOGIN_TIMESTAMP_KEY);
            await AsyncStorage.removeItem('last_dashboard_route');
            setUserData(null);
            userIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchAndSetProfile = useCallback(async (userId: string, enforceExistence: boolean = true) => {
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
                } else if (enforceExistence) {
                    console.warn('⚠️ User authenticated but no profile found in database. Auto-logging out.');
                    await signOut();
                    return;
                }

                return;
            } catch (error: any) {
                const message = error?.message ?? '';
                const isTimeout = typeof message === 'string' && message.includes('Profile fetch timed out');

                if (isTimeout && attempt < maxAttempts) {
                    await sleep(750 * attempt * attempt);
                    continue;
                }

                if (isTimeout) {
                    console.warn('Profile fetch timeout (giving up):', error);
                } else {
                    console.error('Profile fetch error:', error);
                }
                return;
            }
        }
    }, [signOut]);

    const syncPushToken = useCallback(async (userId: string) => {
        if (pushTokenSyncInFlightRef.current) return;
        pushTokenSyncInFlightRef.current = true;

        try {
            const token = await notificationService.registerForPushNotificationsAsync();
            if (!token) return;

            // 1. Check if token actually needs updating to avoid redundant writes
            const { data: existingUser } = await supabase
                .from('users')
                .select('expo_push_token')
                .eq('id', userId)
                .single();

            if (existingUser && existingUser.expo_push_token === token) {
                console.log('✅ Push token already synced and up-to-date.');
                return;
            }

            // 2. Update if different
            console.log('🔄 Syncing new push token...');
            const { error } = await supabase
                .from('users')
                .update({ expo_push_token: token } as any)
                .eq('id', userId);

            if (error) {
                console.error('Failed to update push token:', error);
            } else {
                console.log('✅ Push token synced successfully');
            }
        } catch (e) {
            console.warn('Push token sync failed:', e);
        } finally {
            pushTokenSyncInFlightRef.current = false;
        }
    }, []);

    // When profile loads and user has a valid role, ensure push token is synced.
    // Retry logic is implicit via useEffect dependency: if role updates, we retry.
    useEffect(() => {
        if (!userData?.id) return;

        const allowedRoles = ['chef', 'manager', 'owner'];
        if (!userData.role || !allowedRoles.includes(userData.role)) return;

        void syncPushToken(userData.id);
    }, [userData?.id, userData?.role, syncPushToken]);

    const checkSession = useCallback(async () => {
        try {
            const storedTimestamp = await AsyncStorage.getItem(LOGIN_TIMESTAMP_KEY);
            const now = Date.now();

            if (storedTimestamp) {
                const lastActiveTime = parseInt(storedTimestamp, 10);
                if (now - lastActiveTime > SESSION_TIMEOUT_MS) {
                    console.log('⏰ Session expired (inactive for >24 hours). Logging out.');
                    await signOut();
                    setLoading(false);
                    return;
                }
            }

            await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, now.toString());

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
                setUserData({
                    id: sessionUser.id,
                    email: sessionUser.email ?? '',
                    name: null,
                    role: null,
                    phone: null,
                });

                void fetchAndSetProfile(sessionUser.id);
            } else {
                setUserData(null);
            }
        } catch (error: any) {
            console.error('Session check error:', error);

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
    }, [fetchAndSetProfile, signOut]);

    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                console.log('📱 App resumed, checking session...');
                await checkSession();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [checkSession]);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
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
    }, [checkSession, fetchAndSetProfile]);

    const signIn = async (email: string, password: string) => {
        console.log('🔐 Attempting sign in for:', email);
        const startTotal = Date.now();

        try {
            console.log('⏳ Starting Supabase Auth...');
            const startAuth = Date.now();

            const result = await supabase.auth.signInWithPassword({ email, password });

            const endAuth = Date.now();
            console.log(`✅ Supabase Auth completed in ${endAuth - startAuth}ms`);

            if (result.data?.user) {
                setUserData({
                    id: result.data.user.id,
                    email: result.data.user.email ?? email,
                    name: null,
                    role: null,
                    phone: null,
                });

                console.log('⏳ Fetching user profile...');
                const startProfile = Date.now();

                await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());

                void fetchAndSetProfile(result.data.user.id, false).finally(() => {
                    const endProfile = Date.now();
                    console.log(`✅ Profile fetch finished in ${endProfile - startProfile}ms`);
                });
            }

            console.log(`🏁 Total Login Process took ${Date.now() - startTotal}ms`);
            return result;
        } catch (error: any) {
            console.error('Sign in exception:', error);
            return { data: { user: null, session: null }, error: error };
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
