import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, ChevronRight, User, Crown, ChefHat, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Layout, Spacing } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/database';

export default function LoginScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { signIn, signOut, loading: authLoading, userData, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'owner' | 'manager' | 'chef'>('manager');
    const [loading, setLoading] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigateToDashboard = (userRole: string) => {
        switch (userRole) {
            case 'owner':
                router.replace('/owner');
                break;
            case 'manager':
                router.replace('/manager');
                break;
            case 'chef':
                router.replace('/chef');
                break;
            case 'waiter':
                router.replace('/manager'); // Waiters use manager screens
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        // Auto-redirect if already authenticated and NOT currently processing a manual login
        if (isAuthenticated && userData && !loading) {
            navigateToDashboard(userData.role);
        }
    }, [isAuthenticated, userData, loading]);

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorModalMessage('Please enter both your email and password to continue.');
            setErrorModalVisible(true);
            return;
        }

        setLoading(true);
        try {
            // 1. Attempt Sign In
            const { data, error } = await signIn(email, password);

            if (error) {
                setErrorModalMessage('The email or password you entered is incorrect. Please try again.');
                setErrorModalVisible(true);
                setLoading(false);
                return;
            }

            if (data?.session?.user) {
                // 2. Immediately fetch verification data
                // We use single() to get exact match
                const { data: userRoleData, error: roleError } = await supabase
                    .from('users')
                    .select('role') // Just get the role directly
                    .eq('auth_id', data.session.user.id)
                    .single();

                if (roleError || !userRoleData) {
                    console.error('Role verification error:', roleError);
                    await signOut(); // Abort
                    setLoading(false);
                    setErrorModalMessage('Could not verify user role.');
                    setErrorModalVisible(true);
                    return;
                }

                const dbRole = userRoleData.role;

                // 3. Compare with selected UI role
                // Special case: Waiters log in as Managers in UI if there's no waiter button
                // But user requested Strict Check, so we enforce exact match or sensible mapping.
                // Assuming UI only has Owner, Manager, Chef.

                const isMismatch = dbRole !== role;

                // Allow 'waiter' to act as 'manager' if UI logic permits, but user said "incorrect role... please select correct role".
                // Since there is no "Waiter" button on login screen, waiters MUST select Manager?
                // Let's assume strict for now based on user request.

                if (isMismatch) {
                    // Mismatch detected! Sign out immediately before layout redirect can trigger
                    await signOut();
                    setLoading(false);
                    setErrorModalMessage(
                        `Access Denied\n\nYou are attempting to login as a "${role.toUpperCase()}" but your account is registered as "${String(dbRole).toUpperCase()}".\n\nPlease switch to the correct role.`
                    );
                    setErrorModalVisible(true);
                    return;
                }

                // 4. Success - Role matches!
                navigateToDashboard(dbRole);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            await signOut();
            setLoading(false);
            setErrorModalMessage('An unexpected error occurred during login.');
            setErrorModalVisible(true);
        }
    };

    if (authLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[Colors.dark.background, '#1A1A1A']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Themed error modal */}
                    <Modal
                        visible={errorModalVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setErrorModalVisible(false)}
                        statusBarTranslucent
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalCard}>
                                <View style={styles.errorIconContainer}>
                                    <AlertCircle size={32} color={Colors.dark.error} />
                                </View>
                                <Text style={styles.modalTitle}>{t('login.error') || 'Attention'}</Text>
                                <Text style={styles.modalMessage}>{errorModalMessage}</Text>
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => setErrorModalVisible(false)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalButtonText}>{t('common.tryAgain') || 'Try Again'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                    {/* Logo and Branding */}
                    <View style={styles.header}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('@/assets/images/logo.jpeg')}
                                style={styles.logo}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.appTitle}>The Cheeze Town</Text>
                        <Text style={styles.tagline}>Restaurant Management System</Text>
                    </View>

                    {/* Login Form Card */}
                    <View style={styles.formCard}>
                        {/* Role Switcher */}
                        <View style={styles.roleSelectorContainer}>
                            {/* Owner - Top Row */}
                            <TouchableOpacity
                                style={[styles.roleButtonWide, role === 'owner' && styles.roleButtonActive]}
                                onPress={() => setRole('owner')}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                <Crown size={20} color={role === 'owner' ? Colors.dark.primary : '#666'} />
                                <Text style={[styles.roleButtonText, styles.ownerButtonText, role === 'owner' && styles.ownerButtonTextActive]}>
                                    {t('login.owner')}
                                </Text>
                            </TouchableOpacity>

                            {/* Manager & Chef - Bottom Row */}
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleButton, role === 'manager' && styles.roleButtonActive]}
                                    onPress={() => setRole('manager')}
                                    disabled={loading}
                                >
                                    <User size={18} color={role === 'manager' ? Colors.dark.primary : Colors.dark.textSecondary} />
                                    <Text style={[styles.roleButtonText, role === 'manager' && styles.roleButtonTextActive]}>
                                        {t('login.manager')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleButton, role === 'chef' && styles.roleButtonActive]}
                                    onPress={() => setRole('chef')}
                                    disabled={loading}
                                >
                                    <ChefHat size={18} color={role === 'chef' ? Colors.dark.primary : Colors.dark.textSecondary} />
                                    <Text style={[styles.roleButtonText, role === 'chef' && styles.roleButtonTextActive]}>
                                        Chef
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Inputs */}
                        <View style={styles.inputContainer}>
                            <Mail size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('login.email')}
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('login.password')}
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                {showPassword ? (
                                    <EyeOff size={20} color={Colors.dark.textSecondary} />
                                ) : (
                                    <Eye size={20} color={Colors.dark.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[Colors.dark.primary, '#FFA000']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.loginButton, loading && { opacity: 0.6 }]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.loginButtonText}>{t('login.login')}</Text>
                                        <ChevronRight color="#000" size={20} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: Colors.dark.primary,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: 1,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    formCard: {
        width: '100%',
        backgroundColor: Colors.dark.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(253, 184, 19, 0.1)',
        ...Layout.shadow.large,
    },
    roleSelectorContainer: {
        marginBottom: 20,
        gap: 10,
    },
    roleButtonWide: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        flexDirection: 'row',
        gap: 10,
        backgroundColor: Colors.dark.secondary,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    ownerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    ownerButtonTextActive: {
        color: Colors.dark.primary,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 10,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 6,
        backgroundColor: Colors.dark.secondary,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    roleButtonActive: {
        backgroundColor: Colors.dark.background,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
    },
    roleButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    roleButtonTextActive: {
        color: Colors.dark.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.secondary,
        borderRadius: Layout.radius.xl,
        paddingHorizontal: 18,
        marginBottom: 14,
        height: 56,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: Colors.dark.text,
    },
    loginButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: Layout.radius.xl,
        marginTop: 12,
        gap: 8,
        ...Layout.shadow.medium,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    forgotPassword: {
        alignItems: 'center',
        marginTop: 16,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.dark.card,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...Layout.shadow.large,
    },
    errorIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButton: {
        width: '100%',
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
});
