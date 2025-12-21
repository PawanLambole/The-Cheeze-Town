import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChefSettings {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}

const SETTINGS_KEY = '@chef_settings';

const defaultSettings: ChefSettings = {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
};

export const loadChefSettings = async (): Promise<ChefSettings> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : defaultSettings;
    } catch (e) {
        console.log('Error loading chef settings:', e);
        return defaultSettings;
    }
};

export const saveChefSettings = async (settings: ChefSettings): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(settings);
        await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    } catch (e) {
        console.log('Error saving chef settings:', e);
    }
};
