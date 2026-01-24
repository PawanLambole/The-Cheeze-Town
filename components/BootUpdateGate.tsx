import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, BackHandler, StatusBar } from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import * as updateService from '@/services/updateService';
import { AppVersion } from '@/services/updateService';
import { TriangleAlert, Download } from 'lucide-react-native';

interface BootUpdateGateProps {
    children: React.ReactNode;
}

/**
 * BootUpdateGate
 * 
 * Responsibilities:
 * 1. Runs immediately on app launch (before Auth/Navigation)
 * 2. Checks for Native Updates (Supabase)
 *    - If Mandatory Native -> BLOCK APP (No dismiss, No nav, Exit only via Download)
 * 3. Checks for OTA Updates (Expo Updates)
 *    - If Available -> Fetch & Reload immediately
 * 4. Only renders children if safe to proceed
 */
export const BootUpdateGate: React.FC<BootUpdateGateProps> = ({ children }) => {
    const { t } = useTranslation();
    const [isReady, setIsReady] = useState(false);
    const [blockingUpdate, setBlockingUpdate] = useState<AppVersion | null>(null);
    const [checkingMessage, setCheckingMessage] = useState<string>('');

    useEffect(() => {
        checkBootUpdates();

        // Failsafe: Force ready after 8 seconds if checks hang
        const failsafeTimeout = setTimeout(() => {
            setIsReady((prev) => {
                if (!prev) {
                    console.warn('Boot checks timed out, forcing app load...');
                }
                return true;
            });
        }, 8000);

        return () => clearTimeout(failsafeTimeout);
    }, []);

    // Block back button if regular Mandatory Update is active
    useEffect(() => {
        if (blockingUpdate) {
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                return true; // Disable back button
            });
            return () => subscription.remove();
        }
    }, [blockingUpdate]);

    const checkBootUpdates = async () => {
        try {
            if (__DEV__) {
                setIsReady(true);
                return;
            }

            // Parallelize checks to reduce wait time
            const [nativeCheckResult, otaCheckResult] = await Promise.allSettled([
                updateService.checkForUpdate(),
                Updates.checkForUpdateAsync().catch(e => ({ isAvailable: false })) // Catch individual OTA error
            ]);

            // 1. Handle Native Update (Priority: Blocking)
            if (nativeCheckResult.status === 'fulfilled') {
                const nativeCheck = nativeCheckResult.value;
                if (
                    nativeCheck.updateRequired &&
                    nativeCheck.isMandatory &&
                    nativeCheck.latestVersion?.update_type === 'native'
                ) {
                    setBlockingUpdate(nativeCheck.latestVersion);
                    await SplashScreen.hideAsync();
                    return;
                }
            }

            // 2. Handle OTA Update (Auto-Apply)
            if (otaCheckResult.status === 'fulfilled') {
                // @ts-ignore
                const update = otaCheckResult.value;
                if (update && update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                    return;
                }
            }

        } catch (error) {
            console.error('Boot Update Check Failed:', error);
        }

        // 3. Safe to Proceed
        setIsReady(true);
    };

    const handleDownloadUpdate = async () => {
        if (blockingUpdate?.download_url) {
            await Linking.openURL(blockingUpdate.download_url);
            // We do NOT dismiss the screen. User must install APK and restart.
        }
    };

    if (blockingUpdate) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <TriangleAlert size={64} color="#EF4444" />
                    </View>

                    <Text style={styles.title}>{t('update.updateRequired')}</Text>

                    <Text style={styles.message}>
                        {t('update.mandatoryUpdateMessage')}
                    </Text>

                    {blockingUpdate.version_name && (
                        <Text style={styles.version}>
                            {t('update.version')} {blockingUpdate.version_name}
                        </Text>
                    )}

                    {blockingUpdate.update_message && (
                        <Text style={styles.scaryMessage}>
                            {blockingUpdate.update_message}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleDownloadUpdate}
                        activeOpacity={0.8}
                    >
                        <Download size={24} color="#000" />
                        <Text style={styles.buttonText}>{t('update.downloadUpdate')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!isReady) {
        // Determine what to render while checking.
        // Since we are wrapping AnimatedSplashScreen, if we render null, 
        // nothing mounts. Native splash is visible.
        // If we want to be explicit, we return null.
        return null;
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        gap: 16,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#A1A1AA',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
    },
    version: {
        fontSize: 14,
        color: '#52525B',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    scaryMessage: {
        fontSize: 16,
        color: '#FEF2F2',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        textAlign: 'center',
        width: '100%',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#FDB813', // Brand yellow
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        gap: 12,
    },
    buttonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
