import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';

export default function ChefSettings() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        soundEnabled, setSoundEnabled,
        popupEnabled, setPopupEnabled,
        systemEnabled, setSystemEnabled,
        toggleSetting
    } = useNotificationSettings();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Notifications</Text>

                <View style={styles.card}>
                    {/* Sound Setting */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Sound Alerts</Text>
                            <Text style={styles.settingDescription}>Play sound on new order</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={(val) => toggleSetting('chef_sound_enabled', val, setSoundEnabled)}
                            trackColor={{ false: '#333', true: Colors.dark.primary }}
                            thumbColor={soundEnabled ? '#000' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Popup Setting */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>In-App Popup</Text>
                            <Text style={styles.settingDescription}>Show modal while app is open</Text>
                        </View>
                        <Switch
                            value={popupEnabled}
                            onValueChange={(val) => toggleSetting('chef_popup_enabled', val, setPopupEnabled)}
                            trackColor={{ false: '#333', true: Colors.dark.primary }}
                            thumbColor={popupEnabled ? '#000' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* System Notification Setting */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>System Notifications</Text>
                            <Text style={styles.settingDescription}>Show in notification drawer</Text>
                        </View>
                        <Switch
                            value={systemEnabled}
                            onValueChange={(val) => toggleSetting('chef_system_enabled', val, setSystemEnabled)}
                            trackColor={{ false: '#333', true: Colors.dark.primary }}
                            thumbColor={systemEnabled ? '#000' : '#f4f3f4'}
                        />
                    </View>
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.dark.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    settingDescription: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        width: '100%',
        marginVertical: 4,
    },
});
