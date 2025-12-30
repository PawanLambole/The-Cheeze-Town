import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '@/services/NotificationService';

interface NotificationSettingsContextType {
    soundEnabled: boolean;
    popupEnabled: boolean;
    systemEnabled: boolean;
    setSoundEnabled: (value: boolean) => void;
    setPopupEnabled: (value: boolean) => void;
    setSystemEnabled: (value: boolean) => void;
    toggleSetting: (key: string, value: boolean, setter: (v: boolean) => void) => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [popupEnabled, setPopupEnabled] = useState(true);
    const [systemEnabled, setSystemEnabled] = useState(true);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const sound = await AsyncStorage.getItem('chef_sound_enabled');
            const popup = await AsyncStorage.getItem('chef_popup_enabled');
            const system = await AsyncStorage.getItem('chef_system_enabled');

            const soundValue = sound !== null ? sound === 'true' : true;
            const popupValue = popup !== null ? popup === 'true' : true;
            const systemValue = system !== null ? system === 'true' : true;

            setSoundEnabled(soundValue);
            setPopupEnabled(popupValue);
            setSystemEnabled(systemValue);

            // If system notifications are enabled, ensure we have permissions/channel.
            if (systemValue) {
                const granted = await notificationService.registerForPushNotificationsAsync();
                if (!granted) {
                    setSystemEnabled(false);
                    await AsyncStorage.setItem('chef_system_enabled', 'false');
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
                const granted = await notificationService.registerForPushNotificationsAsync();
                if (!granted) {
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
            setSoundEnabled,
            setPopupEnabled,
            setSystemEnabled,
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
