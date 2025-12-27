import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native';
import { Download, AlertCircle, RefreshCw, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { AppVersion } from '@/services/updateService';

interface UpdateDialogProps {
    visible: boolean;
    version: AppVersion | null;
    isMandatory: boolean;
    currentVersion: { name: string; code: number };
    onUpdate: () => Promise<void>;
    onDismiss?: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
    visible,
    version,
    isMandatory,
    currentVersion,
    onUpdate,
    onDismiss,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!version) return null;

    const isOTA = version.update_type === 'ota';
    const isNative = version.update_type === 'native';

    const handleUpdate = async () => {
        setIsUpdating(true);
        setError(null);

        try {
            if (isOTA) {
                // Perform OTA update
                await onUpdate();
            } else if (isNative && version.download_url) {
                // Open download URL for native update
                const canOpen = await Linking.canOpenURL(version.download_url);
                if (canOpen) {
                    await Linking.openURL(version.download_url);
                    // Don't set isUpdating to false for native updates
                    // as user might return to the app
                } else {
                    setError('Cannot open download link. Please try again later.');
                    setIsUpdating(false);
                }
            }
        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update. Please try again.');
            setIsUpdating(false);
        }
    };

    const handleDismiss = () => {
        if (!isMandatory && onDismiss) {
            onDismiss();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <BlurView intensity={80} style={styles.container}>
                <View style={styles.dialogContainer}>
                    <LinearGradient
                        colors={['#1a1a1a', '#0a0a0a']}
                        style={styles.dialog}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                {isMandatory ? (
                                    <AlertCircle size={32} color="#ef4444" />
                                ) : (
                                    <Download size={32} color="#3b82f6" />
                                )}
                            </View>

                            {!isMandatory && onDismiss && (
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleDismiss}
                                    disabled={isUpdating}
                                >
                                    <X size={24} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {isMandatory ? 'Update Required' : 'Update Available'}
                        </Text>

                        {/* Version Info */}
                        <View style={styles.versionContainer}>
                            <Text style={styles.versionLabel}>Current Version</Text>
                            <Text style={styles.versionText}>{currentVersion.name}</Text>

                            <Text style={styles.versionArrow}>→</Text>

                            <Text style={styles.versionLabel}>New Version</Text>
                            <Text style={[styles.versionText, styles.newVersion]}>
                                {version.version_name}
                            </Text>
                        </View>

                        {/* Update Message */}
                        {version.update_message && (
                            <Text style={styles.message}>{version.update_message}</Text>
                        )}

                        {/* Update Type Badge */}
                        <View style={styles.badgeContainer}>
                            <View style={[
                                styles.badge,
                                isOTA ? styles.otaBadge : styles.nativeBadge
                            ]}>
                                <Text style={styles.badgeText}>
                                    {isOTA ? '⚡ Quick Update' : '📦 Full Update'}
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            {isOTA
                                ? 'This update will download in the background and apply automatically.'
                                : 'This update requires downloading and installing a new version of the app.'}
                        </Text>

                        {isMandatory && (
                            <View style={styles.warningContainer}>
                                <AlertCircle size={16} color="#ef4444" />
                                <Text style={styles.warningText}>
                                    This update is mandatory to continue using the app
                                </Text>
                            </View>
                        )}

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.updateButton,
                                    isUpdating && styles.updatingButton
                                ]}
                                onPress={handleUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <View style={styles.buttonContent}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.buttonText}>
                                            {isOTA ? 'Updating...' : 'Opening...'}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        {isOTA ? (
                                            <RefreshCw size={20} color="#fff" />
                                        ) : (
                                            <Download size={20} color="#fff" />
                                        )}
                                        <Text style={styles.buttonText}>
                                            {isOTA ? 'Update Now' : 'Download Update'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {!isMandatory && onDismiss && (
                                <TouchableOpacity
                                    style={styles.laterButton}
                                    onPress={handleDismiss}
                                    disabled={isUpdating}
                                >
                                    <Text style={styles.laterButtonText}>Maybe Later</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialogContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    dialog: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
    },
    versionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
    },
    versionLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    versionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginRight: 12,
    },
    versionArrow: {
        fontSize: 20,
        color: '#666',
        marginHorizontal: 12,
    },
    newVersion: {
        color: '#3b82f6',
        marginRight: 0,
    },
    message: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 16,
        lineHeight: 24,
    },
    badgeContainer: {
        marginBottom: 12,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    otaBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    nativeBadge: {
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    description: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20,
        lineHeight: 20,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
        marginBottom: 20,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#ef4444',
        fontWeight: '600',
    },
    errorContainer: {
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 13,
        color: '#ef4444',
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 12,
    },
    updateButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    updatingButton: {
        opacity: 0.7,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    laterButton: {
        padding: 16,
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});
