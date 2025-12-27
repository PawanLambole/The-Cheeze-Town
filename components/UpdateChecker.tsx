import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, CheckCircle, Info } from 'lucide-react-native';
import { useUpdate } from '@/contexts/UpdateContext';

interface UpdateCheckerProps {
    showVersionInfo?: boolean;
}

/**
 * Standalone component for manual update checking
 * Perfect for settings screens or admin panels
 */
export const UpdateChecker: React.FC<UpdateCheckerProps> = ({
    showVersionInfo = true,
}) => {
    const {
        checkForUpdate,
        isCheckingUpdate,
        updateAvailable,
        latestVersion,
        currentVersion,
    } = useUpdate();

    return (
        <View style={styles.container}>
            {showVersionInfo && (
                <View style={styles.versionInfo}>
                    <Info size={16} color="#666" />
                    <Text style={styles.versionText}>
                        Current Version: {currentVersion.name} ({currentVersion.code})
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.button,
                    isCheckingUpdate && styles.buttonDisabled,
                ]}
                onPress={checkForUpdate}
                disabled={isCheckingUpdate}
            >
                {isCheckingUpdate ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : updateAvailable ? (
                    <CheckCircle size={20} color="#fff" />
                ) : (
                    <RefreshCw size={20} color="#fff" />
                )}

                <Text style={styles.buttonText}>
                    {isCheckingUpdate
                        ? 'Checking...'
                        : updateAvailable
                            ? 'Update Available'
                            : 'Check for Updates'}
                </Text>
            </TouchableOpacity>

            {updateAvailable && latestVersion && (
                <View style={styles.updateInfo}>
                    <Text style={styles.updateText}>
                        New version {latestVersion.version_name} is available!
                    </Text>
                    <Text style={styles.updateType}>
                        Type: {latestVersion.update_type === 'ota' ? '⚡ Quick Update' : '📦 Full Update'}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        gap: 12,
    },
    versionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    versionText: {
        fontSize: 14,
        color: '#666',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    updateInfo: {
        padding: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    updateText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    updateType: {
        fontSize: 12,
        color: '#888',
    },
});
