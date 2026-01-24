import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
    const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

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
        if (isAuthenticated && userData?.role && !loading) {
            navigateToDashboard(userData.role);
        }
    }, [isAuthenticated, userData, loading]);

    const getRoleIcon = (r: string) => {
        switch (r) {
            case 'owner': return 'ribbon-outline';
            case 'manager': return 'person-outline';
            case 'chef': return 'restaurant-outline';
            default: return 'person-outline';
        }
    };

    const getRoleLabel = (r: string) => {
        switch (r) {
            case 'owner': return t('login.owner');
            case 'manager': return t('login.manager');
            case 'chef': return t('login.chef');
            default: return t('login.manager');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setErrorModalMessage(t('errors.missingCredentials'));
            setErrorModalVisible(true);
            return;
        }

        setLoading(true);
        try {
            // 1. Attempt Sign In
            const { data, error } = await signIn(email, password);

            if (error) {
                setErrorModalMessage(t('errors.invalidCredentials'));
                setErrorModalVisible(true);
                setLoading(false);
                return;
            }

            if (data?.session?.user) {
                // 2. Fetch user role - use maybeSingle() to handle case where profile doesn't exist yet
                const { data: userRoleData, error: roleError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .maybeSingle();

                // If error (not just null data), something went wrong
                if (roleError) {
                    console.error('Database error during role fetch:', roleError);
                    await signOut();
                    setLoading(false);
                    setErrorModalMessage(t('errors.roleVerification'));
                    setErrorModalVisible(true);
                    return;
                }

                // If no profile exists, DO NOT create one. Strictly deny access.
                if (!userRoleData) {
                    console.warn('User authenticated but no profile found in public.users');
                    await signOut();
                    setLoading(false);
                    setErrorModalMessage(t('errors.userNotFound') || 'User profile not found. Please contact support.');
                    setErrorModalVisible(true);
                    return;
                }

                // At this point, userRoleData should exist (we created it if it didn't)
                // But TypeScript doesn't know that, so add a safety check
                if (!userRoleData) {
                    console.error('Unexpected: userRoleData is null after creation attempt');
                    await signOut();
                    setLoading(false);
                    setErrorModalMessage(t('errors.roleVerification'));
                    setErrorModalVisible(true);
                    return;
                }

                const dbRole = userRoleData.role;

                // 3. Compare with selected UI role
                const isMismatch = dbRole !== role;

                if (isMismatch) {
                    // Mismatch detected! Sign out immediately before layout redirect can trigger
                    await signOut();
                    setLoading(false);
                    setErrorModalMessage(
                        t('errors.accessDeniedMessage', { uiRole: role.toUpperCase(), dbRole: String(dbRole).toUpperCase() })
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
            setErrorModalMessage(t('errors.unexpected'));
            setErrorModalVisible(true);
        }
    };


    // --- UI RENDER ---
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#0F0F0F', '#1a1600', '#2C2000']} // Deep dark with subtle gold/cheese hint at bottom
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Background Pattern/Overlay (Optional, using simple shapes or gradient for now) */}
            <View style={styles.backgroundShape1} />
            <View style={styles.backgroundShape2} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>

                    {/* Error Modal */}
                    <Modal
                        visible={errorModalVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setErrorModalVisible(false)}
                        statusBarTranslucent
                    >
                        <View style={styles.modalBackdrop}>
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <Animated.View entering={FadeInDown.springify()} style={styles.modalCard}>
                                <View style={styles.errorIconContainer}>
                                    <Ionicons name="alert-circle" size={32} color="#EF4444" />
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
                            </Animated.View>
                        </View>
                    </Modal>

                    {/* Main Card Content */}
                    <Animated.View entering={FadeInUp.delay(100).duration(800).springify()} style={styles.cardWrapper}>
                        <BlurView intensity={40} tint="dark" style={styles.glassCard}>

                            {/* Header Section */}
                            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
                                <View style={styles.logoWrapper}>
                                    <View style={styles.logoGlow} />
                                    <Image
                                        source={require('@/assets/images/logo.png')}
                                        style={styles.logo}
                                        resizeMode="cover"
                                    />
                                </View>
                                <Text style={styles.appTitle}>THE CHEEZE TOWN</Text>
                                <Text style={styles.tagline}>{t('login.tagline')}</Text>
                            </Animated.View>

                            {/* Form Section */}
                            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.formContainer}>

                                {/* Role Selector */}
                                <View style={{ zIndex: 10 }}>
                                    <View style={styles.roleContainer}>
                                        <Text style={styles.sectionLabel}>Select Identity</Text>
                                        <TouchableOpacity
                                            style={styles.roleDropdownTrigger}
                                            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.roleTriggerContent}>
                                                <Ionicons name={getRoleIcon(role) as any} size={20} color="#FFF" />
                                                <Text style={styles.roleTriggerText}>{getRoleLabel(role)}</Text>
                                            </View>
                                            <Ionicons
                                                name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color="rgba(255,255,255,0.6)"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Dropdown Options */}
                                    {showRoleDropdown && (
                                        <Animated.View
                                            entering={FadeInDown.duration(200)}
                                            style={styles.dropdownOptions}
                                        >
                                            {['owner', 'manager', 'chef'].map((r) => (
                                                <TouchableOpacity
                                                    key={r}
                                                    style={[
                                                        styles.dropdownOption,
                                                        role === r && styles.dropdownOptionActive
                                                    ]}
                                                    onPress={() => {
                                                        setRole(r as any);
                                                        setShowRoleDropdown(false);
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                        <Ionicons
                                                            name={getRoleIcon(r) as any}
                                                            size={18}
                                                            color={role === r ? Colors.dark.primary : 'rgba(255,255,255,0.6)'}
                                                        />
                                                        <Text style={[
                                                            styles.dropdownOptionText,
                                                            role === r && styles.dropdownOptionTextActive
                                                        ]}>
                                                            {getRoleLabel(r)}
                                                        </Text>
                                                    </View>
                                                    {role === r && (
                                                        <Ionicons name="checkmark" size={18} color={Colors.dark.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </Animated.View>
                                    )}
                                </View>

                                {/* Inputs */}
                                <View style={styles.inputsWrapper}>
                                    <BlurView intensity={20} tint="light" style={styles.inputField}>
                                        <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={t('login.email')}
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            editable={!loading}
                                        />
                                    </BlurView>

                                    <BlurView intensity={20} tint="light" style={styles.inputField}>
                                        <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={t('login.password')}
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="rgba(255,255,255,0.5)"
                                            />
                                        </TouchableOpacity>
                                    </BlurView>
                                </View>

                                {/* Action Buttons */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                    style={styles.loginBtnWrapper}
                                >
                                    <LinearGradient
                                        colors={[Colors.dark.primary, '#EAB308']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.loginButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <View style={styles.loginBtnContent}>
                                                <Text style={styles.loginButtonText}>{t('login.login')}</Text>
                                                <Ionicons name="arrow-forward" color="#000" size={20} />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                            </Animated.View>
                        </BlurView>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).springify()}>
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80, // Increased padding top
    },
    // Background Elements
    backgroundShape1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.dark.primary,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    backgroundShape2: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#EAB308', // Gold
        opacity: 0.1,
        transform: [{ scale: 1.2 }],
    },
    // Glass Card
    cardWrapper: {
        width: '100%',
        borderRadius: 24, // Slightly less rounded for smaller look
        overflow: 'visible',
        backgroundColor: 'rgba(255,255,255,0.02)',
        // Removed dark shadow effect as requested
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)', // Keeping subtle border for definition
    },
    glassCard: {
        padding: 24, // Reduced Padding (Components smaller)
        width: '100%',
        alignItems: 'center',
        borderRadius: 24,
        overflow: 'hidden',
    },
    // Header
    header: {
        alignItems: 'center',
        marginBottom: 20, // Reduced from 24
    },
    logoWrapper: {
        width: 80, // Reduced from 100
        height: 80,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.dark.primary,
        opacity: 0.3,
        transform: [{ scale: 1.2 }],
    },
    logo: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
    },
    appTitle: {
        fontSize: 22, // Reduced from 26
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
        marginBottom: 4,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 12, // Reduced from 14
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    // Form
    formContainer: {
        width: '100%',
        gap: 16, // Reduced gap from 20
    },
    roleContainer: {
        gap: 6,
        marginBottom: 4,
        zIndex: 20,
    },
    sectionLabel: {
        fontSize: 11, // Reduced from 12
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 6,
    },
    // Dropdown Styles
    roleDropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 48, // Reduced from 54
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14, // Slightly smaller radius
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    roleTriggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    roleTriggerText: {
        fontSize: 15, // Reduced from 16
        color: '#FFF',
        fontWeight: '600',
    },
    dropdownOptions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 6,
        backgroundColor: '#1E1E1E',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
        zIndex: 100,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10, // Reduced padding
        borderRadius: 10,
    },
    dropdownOptionActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dropdownOptionText: {
        fontSize: 14, // Reduced fontSize
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    dropdownOptionTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    // Inputs
    inputsWrapper: {
        gap: 12, // Reduced from 16
        zIndex: 1,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12, // Reduced from 16 to utilize space better
        height: 48, // Reduced from 54
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 4, // Reduced from 8 to bring icon and text even closer
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFF',
        height: '100%',
    },
    // Button
    loginBtnWrapper: {
        marginTop: 8,
        borderRadius: 14,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    loginButton: {
        height: 44, // Reduced from 48
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        fontSize: 15, // Reduced from 16
        fontWeight: '700',
        color: '#000',
        letterSpacing: 0.5,
    },
    // Footer
    forgotPassword: {
        marginTop: 20,
        padding: 8,
    },
    forgotPasswordText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '500',
    },
    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    errorIconContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButton: {
        width: '100%',
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});
