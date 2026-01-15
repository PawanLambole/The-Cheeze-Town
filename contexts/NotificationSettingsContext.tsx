import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, Linking } from 'react-native';
import { notificationService } from '@/services/NotificationService';

interface NotificationSettingsContextType {
    soundEnabled: boolean;
    popupEnabled: boolean;
    systemEnabled: boolean;
    // Manager Settings
    managerSoundEnabled: boolean;
    managerPopupEnabled: boolean;
    managerSystemEnabled: boolean;
    // Owner Settings
    ownerSoundEnabled: boolean;
    ownerPopupEnabled: boolean;
    ownerSystemEnabled: boolean;

    setSoundEnabled: (value: boolean) => void;
    setPopupEnabled: (value: boolean) => void;
    setSystemEnabled: (value: boolean) => void;

    // Manager Setters
    setManagerSoundEnabled: (value: boolean) => void;
    setManagerPopupEnabled: (value: boolean) => void;
    setManagerSystemEnabled: (value: boolean) => void;

    // Owner Setters
    setOwnerSoundEnabled: (value: boolean) => void;
    setOwnerPopupEnabled: (value: boolean) => void;
    setOwnerSystemEnabled: (value: boolean) => void;

    // Generic toggle is sufficient for all if we expose the state
    toggleSetting: (key: string, value: boolean, setter: (v: boolean) => void) => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [popupEnabled, setPopupEnabled] = useState(true);
    const [systemEnabled, setSystemEnabled] = useState(true);

    // Manager
    const [managerSoundEnabled, setManagerSoundEnabled] = useState(true);
    const [managerPopupEnabled, setManagerPopupEnabled] = useState(true);
    const [managerSystemEnabled, setManagerSystemEnabled] = useState(true);

    // Owner
    const [ownerSoundEnabled, setOwnerSoundEnabled] = useState(true);
    const [ownerPopupEnabled, setOwnerPopupEnabled] = useState(true);
    const [ownerSystemEnabled, setOwnerSystemEnabled] = useState(true);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    // When app becomes active again, re-check permission and re-request if needed.
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (state) => {
            if (state !== 'active') return;
            // Check if ANY system notification is enabled
            if (!systemEnabled && !managerSystemEnabled && !ownerSystemEnabled) return;

            try {
                const permission = await notificationService.ensureNotificationPermissionsAsync();
                if (permission.granted) return;

                if (!permission.canAskAgain) {
                    // Only alert if we really expect notifications
                    console.log('System notifications expected but permission denied/disabled.');
                }
            } catch (error) {
                console.error('Error re-checking notification permissions:', error);
            }
        });

        return () => sub.remove();
    }, [systemEnabled, managerSystemEnabled, ownerSystemEnabled]);

    const loadSettings = async () => {
        try {
            // Chef
            const sound = await AsyncStorage.getItem('chef_sound_enabled');
            const popup = await AsyncStorage.getItem('chef_popup_enabled');
            const system = await AsyncStorage.getItem('chef_system_enabled');

            setSoundEnabled(sound !== null ? sound === 'true' : true);
            setPopupEnabled(popup !== null ? popup === 'true' : true);
            setSystemEnabled(system !== null ? system === 'true' : true);

            // Manager
            const mSound = await AsyncStorage.getItem('manager_sound_enabled');
            const mPopup = await AsyncStorage.getItem('manager_popup_enabled');
            const mSystem = await AsyncStorage.getItem('manager_system_enabled');

            setManagerSoundEnabled(mSound !== null ? mSound === 'true' : true);
            setManagerPopupEnabled(mPopup !== null ? mPopup === 'true' : true);
            setManagerSystemEnabled(mSystem !== null ? mSystem === 'true' : true);

            // Owner
            const oSound = await AsyncStorage.getItem('owner_sound_enabled');
            const oPopup = await AsyncStorage.getItem('owner_popup_enabled');
            const oSystem = await AsyncStorage.getItem('owner_system_enabled');

            setOwnerSoundEnabled(oSound !== null ? oSound === 'true' : true);
            setOwnerPopupEnabled(oPopup !== null ? oPopup === 'true' : true);
            setOwnerSystemEnabled(oSystem !== null ? oSystem === 'true' : true);

            // If ANY system notifications are enabled, ensure we have permissions/token
            if ((system !== null && system === 'true') || (mSystem !== null && mSystem === 'true') || (oSystem !== null && oSystem === 'true')) {
                const token = await notificationService.registerForPushNotificationsAsync();
                if (!token) {
                    // If failed, disable all system settings? Or just log?
                    console.log('Failed to get token on load, notifications might not work.');
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
        try {
            // Special handling: when enabling system notifications, request permission first.
            if (key === 'chef_system_enabled' && value) {
                const token = await notificationService.registerForPushNotificationsAsync();
                if (!token) {
                    setter(false);
                    await AsyncStorage.setItem(key, 'false');
                    return;
                }
            }

            setter(value);
            await AsyncStorage.setItem(key, String(value));
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    return (
        <NotificationSettingsContext.Provider value={{
            soundEnabled,
            popupEnabled,
            systemEnabled,

            managerSoundEnabled,
            managerPopupEnabled,
            managerSystemEnabled,

            ownerSoundEnabled,
            ownerPopupEnabled,
            ownerSystemEnabled,

            setSoundEnabled,
            setPopupEnabled,
            setSystemEnabled,

            setManagerSoundEnabled,
            setManagerPopupEnabled,
            setManagerSystemEnabled,

            setOwnerSoundEnabled,
            setOwnerPopupEnabled,
            setOwnerSystemEnabled,

            toggleSetting
        }}>
            {children}
        </NotificationSettingsContext.Provider>
    );
}

export function useNotificationSettings() {
    const context = useContext(NotificationSettingsContext);
    if (context === undefined) {
        throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
    }
    return context;
}
