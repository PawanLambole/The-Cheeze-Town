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
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
            } else {
                setUserData(data);
            }
        } catch (error) {
            console.error('Error:', error);
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
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('supabase.auth.token');
            setSession(null);
            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error('Error signing out:', error);
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
