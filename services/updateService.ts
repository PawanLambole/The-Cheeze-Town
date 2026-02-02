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
        // Direct Query Strategy (Bypass RPC)

        // 1. Get Global Config
        const { data: configData, error: configError } = await supabase
            .from('app_config')
            .select('min_supported_version_code')
            .limit(1)
            .single();

        if (configError) throw configError;

        // 2. Find Latest Active Version
        const { data: latestVersionData, error: versionError } = await supabase
            .from('app_versions')
            .select('*')
            .eq('is_active', true)
            // @ts-ignore
            .gt('version_code', currentVersion.code) // Only look for newer versions
            .order('version_code', { ascending: false })
            .limit(1);

        if (versionError) throw versionError;

        await recordUpdateCheck();

        if (!latestVersionData || latestVersionData.length === 0) {
            return {
                updateRequired: false,
                isMandatory: false,
                latestVersion: null,
                currentVersion,
            };
        }

        const latestVersion = latestVersionData[0];
        const minSupportedCode = configData?.min_supported_version_code || 0;
        const isMandatory = latestVersion.is_mandatory || (minSupportedCode > currentVersion.code);

        return {
            updateRequired: true,
            isMandatory: isMandatory,
            latestVersion: {
                version_name: latestVersion.version_name,
                version_code: latestVersion.version_code,
                update_type: latestVersion.update_type as 'ota' | 'native',
                is_mandatory: isMandatory,
                download_url: latestVersion.update_type === 'native' ? LANDING_PAGE_URL : latestVersion.download_url,
                release_notes: latestVersion.release_notes,
                update_message: latestVersion.update_message,
            },
            currentVersion,
        };

    } catch (error: any) {
        console.error('Error in checkForUpdate:', error);
        return {
            updateRequired: false,
            isMandatory: false,
            latestVersion: null,
            currentVersion,
        };
    }
};

const JUST_UPDATED_KEY = '@app_just_updated_version';

export const setJustUpdated = async (version: string) => {
    try {
        await AsyncStorage.setItem(JUST_UPDATED_KEY, version);
    } catch (e) {
        console.error('Error setting updated flag', e);
    }
};

export const checkJustUpdated = async (): Promise<string | null> => {
    try {
        const val = await AsyncStorage.getItem(JUST_UPDATED_KEY);
        if (val) {
            await AsyncStorage.removeItem(JUST_UPDATED_KEY);
            return val;
        }
        return null;
    } catch (e) {
        return null;
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
