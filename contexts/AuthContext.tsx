import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
    id: number;
    auth_id: string;
    email: string;
    name?: string;
    role: 'owner' | 'manager' | 'chef' | 'waiter' | 'customer';
    phone?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user.id);
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserData = async (authId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authId)
                .maybeSingle();

            if (data) {
                setUserData(data);
            } else {
                console.log('No user profile found, creating default profile...');
                // Get current user details to populate profile
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const newUser = {
                        auth_id: authId,
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                        role: 'manager', // Default to manager for development convenience
                        phone: user.phone || '',
                        status: 'approved'
                    };

                    const { data: createdUser, error: createError } = await supabase
                        .from('users')
                        .insert([newUser])
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating user profile:', createError);
                    } else if (createdUser) {
                        setUserData(createdUser);
                    }
                }
            }
        } catch (error) {
            console.error('Error in fetchUserData:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { data: null, error };
            }

            // Session and user will be set by onAuthStateChange listener
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            // Attempt to sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Supabase signOut error:', error);
            }
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            // Always clear local state and storage
            try {
                // The key depends on your Supabase config, usually it's handled by Supabase client internally
                // but we can try to clear common keys or just rely on Supabase client.
                await AsyncStorage.removeItem('supabase.auth.token');
            } catch (e) {
                // Ignore storage error
            }
            setSession(null);
            setUser(null);
            setUserData(null);
        }
    };

    const value = {
        session,
        user,
        userData,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!session,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
