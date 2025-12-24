import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

            if (sound !== null) setSoundEnabled(sound === 'true');
            if (popup !== null) setPopupEnabled(popup === 'true');
            if (system !== null) setSystemEnabled(system === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
        try {
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
