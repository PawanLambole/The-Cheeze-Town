import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
    pushEnabled: boolean;
    soundEnabled: boolean;
    bannerEnabled: boolean;
}

const PREFERENCES_KEY = '@notification_preferences';

const defaultPreferences: NotificationPreferences = {
    pushEnabled: true,
    soundEnabled: true,
    bannerEnabled: true,
};

export const notificationPreferences = {
    /**
     * Get notification preferences from storage
     */
    async get(): Promise<NotificationPreferences> {
        try {
            const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            return defaultPreferences;
        } catch (error) {
            console.error('Error loading notification preferences:', error);
            return defaultPreferences;
        }
    },

    /**
     * Save notification preferences to storage
     */
    async save(preferences: NotificationPreferences): Promise<void> {
        try {
            await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving notification preferences:', error);
        }
    },

    /**
     * Update a single preference
     */
    async update(key: keyof NotificationPreferences, value: boolean): Promise<void> {
        try {
            const current = await this.get();
            const updated = { ...current, [key]: value };
            await this.save(updated);
        } catch (error) {
            console.error('Error updating notification preference:', error);
        }
    },

    /**
     * Reset to default preferences
     */
    async reset(): Promise<void> {
        await this.save(defaultPreferences);
    },
};
