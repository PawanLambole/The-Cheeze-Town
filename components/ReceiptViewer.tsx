import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Share, Platform, ActivityIndicator, Alert } from 'react-native';
import { X, Share2, Printer } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import intentPrinterService from '@/services/IntentPrinterService';

interface ReceiptViewerProps {
    visible: boolean;
    onClose: () => void;
    receipt: string;
    title?: string;
    onConfirm?: () => Promise<void> | void;
}

/**
 * Receipt Viewer Component
 * Displays formatted thermal printer receipt in the app
 * Uses external printer apps for printing (e.g., RawBT Print Service)
 */
export default function ReceiptViewer({ visible, onClose, receipt, title = 'Kitchen Receipt', onConfirm }: ReceiptViewerProps) {
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        try {
            setPrinting(true);

            // Check if on web platform
            if (Platform.OS === 'web') {
                Alert.alert(
                    'Print Not Available',
                    'Thermal printing is not available on web. Please use Share to save the receipt.',
                    [{ text: 'OK' }]
                );
                setPrinting(false);
                return;
            }

            // Use external printer app
            Alert.alert(
                'Print via External App',
                'This will open your thermal printer app (e.g., RawBT Print Service). Make sure you have a thermal printer app installed and configured.',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => setPrinting(false) },
                    {
                        text: 'Open Printer App',
                        onPress: async () => {
                            try {
                                await intentPrinterService.printViaRawBT(receipt);
                            } catch (err: any) {
                                Alert.alert('Print Error', err.message || 'Failed to print. Make sure RawBT Print Service or similar app is installed.');
                            } finally {
                                setPrinting(false);
                            }
                        }
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Print Error', error.message || 'Failed to print receipt');
            setPrinting(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: receipt,
                title: title,
            });
        } catch (error) {
            console.error('Error sharing receipt:', error);
        }
    };

    const handleDone = async () => {
        if (onConfirm) {
            try {
                setLoading(true);
                await onConfirm();
            } finally {
                setLoading(false);
            }
        } else {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, onConfirm && { borderColor: Colors.dark.primary, borderWidth: 2 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Printer size={20} color="#1F2937" />
                            <Text style={styles.headerTitle}>{title}</Text>
                        </View>
                        {!loading && (
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Receipt Display */}
                    <ScrollView
                        style={styles.receiptContainer}
                        contentContainerStyle={styles.receiptContentContainer}
                        showsVerticalScrollIndicator={true}
                    >
                        <View style={styles.receiptPaper}>
                            <Text style={styles.receiptText}>{receipt}</Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.printButton]}
                            onPress={handlePrint}
                            disabled={loading || printing}
                        >
                            {printing ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Printer size={18} color="#FFFFFF" />
                                    <Text style={styles.printButtonText}>Print</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.shareButton]}
                            onPress={handleShare}
                            disabled={loading || printing}
                        >
                            <Share2 size={18} color="#FFFFFF" />
                            <Text style={styles.shareButtonText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.doneButton]}
                            onPress={handleDone}
                            disabled={loading || printing}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.doneButtonText}>Done</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        flex: 1,
        maxHeight: '100%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    receiptContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    receiptContentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    receiptPaper: {
        backgroundColor: '#FAFAFA',
        padding: 16,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 380,
    },
    receiptText: {
        fontFamily: Platform.select({
            ios: 'Courier',
            android: 'monospace',
            default: 'monospace',
        }),
        fontSize: 12,
        lineHeight: 16,
        color: '#1F2937',
        textAlign: 'left',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    shareButton: {
        backgroundColor: '#3B82F6',
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    printButton: {
        backgroundColor: '#8B5CF6',
    },
    printButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    doneButton: {
        backgroundColor: '#10B981',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
