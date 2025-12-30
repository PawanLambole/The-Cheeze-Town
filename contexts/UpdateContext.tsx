import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { UpdateDialog } from '@/components/UpdateDialog';
import * as updateService from '@/services/updateService';
import type { UpdateCheckResult, AppVersion } from '@/services/updateService';

interface UpdateContextType {
    checkForUpdate: () => Promise<boolean>;
    isCheckingUpdate: boolean;
    updateAvailable: boolean;
    latestVersion: AppVersion | null;
    currentVersion: { name: string; code: number };
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdate = () => {
    const context = useContext(UpdateContext);
    if (!context) {
        throw new Error('useUpdate must be used within UpdateProvider');
    }
    return context;
};

interface UpdateProviderProps {
    children: React.ReactNode;
    checkOnMount?: boolean;
    checkOnResume?: boolean;
    checkInterval?: number; // hours
}

export const UpdateProvider: React.FC<UpdateProviderProps> = ({
    children,
    checkOnMount = true,
    checkOnResume = true,
    checkInterval = 24,
}) => {
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const currentVersion = updateService.getCurrentVersion();

    const checkForUpdate = useCallback(async (force: boolean = false) => {
        try {
            // Don't check in development mode
            if (updateService.isDevelopmentMode() && !force) {
                console.log('⚠️ Skipping update check in development mode');
                return false;
            }

            // Check if enough time has passed since last check
            if (!force) {
                const shouldCheck = await updateService.shouldCheckForUpdate(checkInterval);
                if (!shouldCheck) {
                    console.log('⏭️ Skipping update check - too soon since last check');
                    return false;
                }
            }

            setIsCheckingUpdate(true);

            let result: UpdateCheckResult | null = null;

            try {
                console.log('🔍 Checking for updates...');
                result = await updateService.checkForUpdate();

                console.log('Update check result:', {
                    updateRequired: result.updateRequired,
                    isMandatory: result.isMandatory,
                    currentVersion: result.currentVersion,
                    latestVersion: result.latestVersion?.version_name,
                });

                setUpdateResult(result);

                if (result.updateRequired && result.latestVersion) {
                    // Check if user has dismissed this version (only for non-mandatory updates)
                    if (!result.isMandatory) {
                        const hasDismissed = await updateService.hasUserDismissedUpdate(
                            result.latestVersion.version_code
                        );
                        if (hasDismissed) {
                            console.log('⏭️ User has dismissed this update');
                            return result.updateRequired;
                        }
                    }

                    // Show update dialog
                    setShowUpdateDialog(true);
                }
            } catch (error) {
                console.error('❌ Error checking for updates:', error);
                // Don't throw - just log and continue
            } finally {
                setIsCheckingUpdate(false);
            }
            return result?.updateRequired ?? false;
        } catch (error) {
            // Catch any errors from the outer try block (e.g., isDevelopmentMode)
            console.error('❌ Fatal error in update check initialization:', error);
            setIsCheckingUpdate(false);
            return false;
        }
    }, [checkInterval]);

    const handleUpdate = async () => {
        if (!updateResult?.latestVersion) return;

        const isOTA = updateResult.latestVersion.update_type === 'ota';

        if (isOTA) {
            // Perform OTA update
            await updateService.performOTAUpdate();
            // App will reload automatically
        } else {
            // Native update - download URL will be opened by UpdateDialog
            // User needs to install the APK manually
        }
    };

    const handleDismissUpdate = async () => {
        if (updateResult?.latestVersion && !updateResult.isMandatory) {
            await updateService.dismissUpdate(updateResult.latestVersion.version_code);
            setShowUpdateDialog(false);
        }
    };

    // Check for updates on mount
    useEffect(() => {
        if (checkOnMount) {
            // Delay initial check by 2 seconds to let app initialize
            const timer = setTimeout(() => {
                checkForUpdate();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [checkOnMount, checkForUpdate]);

    // Check for updates when app resumes
    useEffect(() => {
        if (!checkOnResume) return;

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkForUpdate();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [checkOnResume, checkForUpdate]);

    const contextValue: UpdateContextType = {
        checkForUpdate: () => checkForUpdate(true),
        isCheckingUpdate,
        updateAvailable: updateResult?.updateRequired || false,
        latestVersion: updateResult?.latestVersion || null,
        currentVersion,
    };

    return (
        <UpdateContext.Provider value={contextValue}>
            {children}

            {updateResult && (
                <UpdateDialog
                    visible={showUpdateDialog}
                    version={updateResult.latestVersion}
                    isMandatory={updateResult.isMandatory}
                    currentVersion={currentVersion}
                    onUpdate={handleUpdate}
                    onDismiss={updateResult.isMandatory ? undefined : handleDismissUpdate}
                />
            )}
        </UpdateContext.Provider>
    );
};
