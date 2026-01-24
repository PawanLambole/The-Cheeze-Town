import { supabase } from '@/config/supabase';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_CHECK_KEY = '@last_update_check';
const UPDATE_DISMISSED_KEY = '@update_dismissed_version';

export interface AppVersion {
    version_name: string;
    version_code: number;
    update_type: 'ota' | 'native';
    is_mandatory: boolean;
    download_url: string | null;
    release_notes: string | null;
    update_message: string | null;
}

export interface UpdateCheckResult {
    updateRequired: boolean;
    isMandatory: boolean;
    latestVersion: AppVersion | null;
    currentVersion: {
        name: string;
        code: number;
    };
}

/**
 * Get the current app version
 */
export const getCurrentVersion = (): { name: string; code: number } => {
    // Priority: Env Var (OTA) > Native Version > Default
    const envVersion = process.env.EXPO_PUBLIC_APP_VERSION;
    const envCode = process.env.EXPO_PUBLIC_APP_VERSION_CODE;

    const nativeVersion = Application.nativeApplicationVersion;
    const nativeCode = Application.nativeBuildVersion;

    console.log('[VersionCheck] Env:', envVersion, envCode, '| Native:', nativeVersion, nativeCode);

    return {
        name: envVersion || nativeVersion || '1.0.0',
        code: parseInt(envCode || nativeCode || '100', 10),
    };
};

/**
 * Get the platform string for version checking
 */
const getPlatform = (): string => {
    return Platform.OS === 'ios' ? 'ios' : 'android';
};

/**
 * Check if an update check should be performed based on interval
 */
export const shouldCheckForUpdate = async (intervalHours: number = 24): Promise<boolean> => {
    try {
        const lastCheckStr = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
        if (!lastCheckStr) return true;

        const lastCheck = new Date(lastCheckStr);
        const now = new Date();
        const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

        return hoursSinceLastCheck >= intervalHours;
    } catch (error) {
        console.error('Error checking update interval:', error);
        return true; // Default to checking
    }
};

/**
 * Record that an update check was performed
 */
const recordUpdateCheck = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(UPDATE_CHECK_KEY, new Date().toISOString());
    } catch (error) {
        console.error('Error recording update check:', error);
    }
};

/**
 * Check if user has dismissed this version's update
 */
export const hasUserDismissedUpdate = async (versionCode: number): Promise<boolean> => {
    try {
        const dismissedVersion = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
        return dismissedVersion === versionCode.toString();
    } catch (error) {
        console.error('Error checking dismissed update:', error);
        return false;
    }
};

/**
 * Record that user dismissed this version's update
 */
export const dismissUpdate = async (versionCode: number): Promise<void> => {
    try {
        await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, versionCode.toString());
    } catch (error) {
        console.error('Error dismissing update:', error);
    }
};

/**
 * Clear dismissed update (when mandatory update is found)
 */
export const clearDismissedUpdate = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(UPDATE_DISMISSED_KEY);
    } catch (error) {
        console.error('Error clearing dismissed update:', error);
    }
};

const LANDING_PAGE_URL = 'https://the-cheeze-town-app.vercel.app/';

/**
 * Check for available updates
 */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
    const currentVersion = getCurrentVersion();
    const platform = getPlatform();

    try {
        // Call Supabase function to check for updates
        // Call Supabase function to check for updates with timeout
        // @ts-ignore - Type will be available after database migration
        const rpcPromise = (supabase.rpc as any)('check_update_required', {
            p_current_version_code: currentVersion.code,
            p_platform: platform,
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Update check timed out')), 3000)
        );

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

        if (error) {
            console.error('Error checking for update:', error);
            throw error;
        }

        await recordUpdateCheck();

        if (!data || data.length === 0) {
            return {
                updateRequired: false,
                isMandatory: false,
                latestVersion: null,
                currentVersion,
            };
        }

        const updateInfo = data[0];

        // Clear dismissed update if this is mandatory
        if (updateInfo.is_mandatory) {
            await clearDismissedUpdate();
        }

        return {
            updateRequired: updateInfo.update_required,
            isMandatory: updateInfo.is_mandatory,
            latestVersion: updateInfo.update_required ? {
                version_name: updateInfo.latest_version_name,
                version_code: updateInfo.latest_version_code,
                update_type: updateInfo.update_type,
                is_mandatory: updateInfo.is_mandatory,
                download_url: updateInfo.update_type === 'native' ? LANDING_PAGE_URL : updateInfo.download_url,
                release_notes: null,
                update_message: updateInfo.update_message,
            } : null,
            currentVersion,
        };
    } catch (error: any) {
        if (error.message === 'Update check timed out') {
            console.warn('⚠️ Update check timed out - skipping update check.');
        } else {
            console.error('Error in checkForUpdate:', error);
        }
        return {
            updateRequired: false,
            isMandatory: false,
            latestVersion: null,
            currentVersion,
        };
    }
};

/**
 * Perform OTA update using Expo Updates
 */
export const performOTAUpdate = async (): Promise<boolean> => {
    try {
        // Check if updates are available
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
            // Fetch the update
            await Updates.fetchUpdateAsync();

            // Reload the app with the new update
            await Updates.reloadAsync();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error performing OTA update:', error);
        throw error;
    }
};

/**
 * Get the download URL for native update (APK)
 */
export const getDownloadUrl = async (versionCode?: number): Promise<string | null> => {
    // Always return the landing page URL for native updates
    return LANDING_PAGE_URL;
};

/**
 * Check if app is in development mode
 */
export const isDevelopmentMode = (): boolean => {
    return __DEV__ || !Updates.isEnabled;
};

/**
 * Get update channel (for OTA updates)
 */
export const getUpdateChannel = (): string | null => {
    return Updates.channel || null;
};

/**
 * Get current runtime version
 */
export const getRuntimeVersion = (): string | null => {
    return Updates.runtimeVersion || null;
};

export default {
    getCurrentVersion,
    checkForUpdate,
    performOTAUpdate,
    getDownloadUrl,
    shouldCheckForUpdate,
    hasUserDismissedUpdate,
    dismissUpdate,
    clearDismissedUpdate,
    isDevelopmentMode,
    getUpdateChannel,
    getRuntimeVersion,
};
