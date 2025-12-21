import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Bell, Lock, Volume2, Settings as SettingsIcon, Info, LogOut, Languages, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { loadChefSettings, saveChefSettings, ChefSettings } from '@/utils/chefSettings';
import { Colors } from '@/constants/Theme';
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
        >
            <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>{icon}</View>
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
                        trackColor={{ false: Colors.dark.secondary, true: Colors.dark.primary }}
                        thumbColor="#1E1E1E"
                    />
                )}
                {showArrow && !hasSwitch && <ChevronRight size={20} color={Colors.dark.textSecondary} />}
            </View>
        </TouchableOpacity>
    );
}



export default function ChefSettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { signOut } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // Load settings on mount
    useEffect(() => {
        loadChefSettings().then(settings => {
            setNotificationsEnabled(settings.notificationsEnabled);
            setSoundEnabled(settings.soundEnabled);
            setVibrationEnabled(settings.vibrationEnabled);
        });
    }, []);

    // Save setting handler
    const handleSettingChange = async (key: keyof ChefSettings, value: boolean) => {
        const newSettings = {
            notificationsEnabled,
            soundEnabled,
            vibrationEnabled,
            [key]: value,
        };
        await saveChefSettings(newSettings);

        // Update local state
        if (key === 'notificationsEnabled') setNotificationsEnabled(value);
        if (key === 'soundEnabled') setSoundEnabled(value);
        if (key === 'vibrationEnabled') setVibrationEnabled(value);
    };

    const handleLanguageChange = async (language: string) => {
        await changeLanguage(language);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const insets = useSafeAreaInsets();

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
                    <Text style={styles.sectionTitle}>Language</Text>
                    <View style={styles.settingsList}>
                        <TouchableOpacity
                            style={styles.languageOption}
                            onPress={() => handleLanguageChange('en')}
                        >
                            <View style={styles.languageLeft}>
                                <Languages size={20} color={Colors.dark.textSecondary} style={styles.settingIcon} />
                                <Text style={styles.languageText}>English</Text>
                            </View>
                            {i18n.language === 'en' && (
                                <View style={styles.selectedDot} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.languageOption}
                            onPress={() => handleLanguageChange('mr')}
                        >
                            <View style={styles.languageLeft}>
                                <Languages size={20} color={Colors.dark.textSecondary} style={styles.settingIcon} />
                                <Text style={styles.languageText}>मराठी (Marathi)</Text>
                            </View>
                            {i18n.language === 'mr' && (
                                <View style={styles.selectedDot} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingsList}>
                        <SettingItem
                            icon={<Bell size={20} color={Colors.dark.textSecondary} />}
                            title="Order Notifications"
                            subtitle="Receive alerts for new orders"
                            hasSwitch
                            switchValue={notificationsEnabled}
                            onSwitchChange={(value) => handleSettingChange('notificationsEnabled', value)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon={<Volume2 size={20} color={Colors.dark.textSecondary} />}
                            title="Sound Alerts"
                            subtitle="Play sound for new orders"
                            hasSwitch
                            switchValue={soundEnabled}
                            onSwitchChange={(value) => handleSettingChange('soundEnabled', value)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon={<Bell size={20} color={Colors.dark.textSecondary} />}
                            title="Vibration"
                            subtitle="Vibrate on new orders"
                            hasSwitch
                            switchValue={vibrationEnabled}
                            onSwitchChange={(value) => handleSettingChange('vibrationEnabled', value)}
                            showArrow={false}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.settingsList}>
                        <SettingItem
                            icon={<Lock size={20} color={Colors.dark.textSecondary} />}
                            title="PIN Lock"
                            subtitle="Secure kitchen access with PIN"
                            onPress={() => console.log('PIN lock')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.settingsList}>
                        <SettingItem
                            icon={<Info size={20} color={Colors.dark.textSecondary} />}
                            title="App Version"
                            value="1.0.0"
                            showArrow={false}
                        />
                        <SettingItem
                            icon={<Info size={20} color={Colors.dark.textSecondary} />}
                            title="Help & Support"
                            onPress={() => console.log('Help')}
                        />
                        <SettingItem
                            icon={<Info size={20} color={Colors.dark.textSecondary} />}
                            title="Terms of Service"
                            onPress={() => console.log('Terms')}
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
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.dark.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.text,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginRight: 8,
    },
    logoutSection: {
        marginTop: 24,
        marginBottom: 40,
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
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    languageText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.text,
        marginLeft: 16,
    },
    selectedDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.dark.primary,
    },
});
