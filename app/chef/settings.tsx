import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, LogOut, Volume2, MessageSquare, Smartphone } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    value?: string;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true, value, hasSwitch, switchValue, onSwitchChange }: SettingItemProps) {
    return (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={hasSwitch}
            activeOpacity={0.7}
        >
            <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>{icon}</View>
                <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingRight}>
                {value && <Text style={styles.settingValue}>{value}</Text>}
                {hasSwitch && (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: '#3F3F46', true: Colors.dark.primary }}
                        thumbColor={switchValue ? '#FFFFFF' : '#F4F4F5'}
                    />
                )}
                {showArrow && !hasSwitch && <ChevronRight size={18} color={Colors.dark.textSecondary} />}
            </View>
        </TouchableOpacity>
    );
}

export default function ChefSettings() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();
    const {
        soundEnabled, setSoundEnabled,
        popupEnabled, setPopupEnabled,
        systemEnabled, setSystemEnabled,
        toggleSetting
    } = useNotificationSettings();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            setShowLogoutModal(false);
            await signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingsList}>
                        <SettingItem
                            icon={<Volume2 size={20} color={Colors.dark.primary} />}
                            title="Sound Alerts"
                            subtitle="Play sound on new order"
                            hasSwitch
                            switchValue={soundEnabled}
                            onSwitchChange={(val) => toggleSetting('chef_sound_enabled', val, setSoundEnabled)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon={<MessageSquare size={20} color={Colors.dark.primary} />}
                            title="In-App Popup"
                            subtitle="Show modal while app is open"
                            hasSwitch
                            switchValue={popupEnabled}
                            onSwitchChange={(val) => toggleSetting('chef_popup_enabled', val, setPopupEnabled)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon={<Smartphone size={20} color={Colors.dark.primary} />}
                            title="System Notifications"
                            subtitle="Show in notification drawer"
                            hasSwitch
                            switchValue={systemEnabled}
                            onSwitchChange={(val) => toggleSetting('chef_system_enabled', val, setSystemEnabled)}
                            showArrow={false}
                        />
                    </View>
                </View>

                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal visible={showLogoutModal} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Logout</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.logoutConfirmButton]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    settingsList: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginHorizontal: 20,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(253, 184, 19, 0.1)', // Primary color opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
        gap: 4,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    settingSubtitle: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        lineHeight: 18,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingValue: {
        fontSize: 14,
        color: Colors.dark.primary,
        fontWeight: '500',
        marginRight: 4,
    },
    logoutSection: {
        marginTop: 32,
        marginBottom: 48,
        paddingHorizontal: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.card,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
        // Shadows
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.dark.secondary,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    logoutConfirmButton: {
        backgroundColor: Colors.dark.error,
    },
    cancelButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
        fontSize: 16,
    },
    logoutConfirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
