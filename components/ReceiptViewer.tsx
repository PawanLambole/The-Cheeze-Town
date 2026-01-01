import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Share, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { X, Share2, Printer } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import intentPrinterService from '@/services/IntentPrinterService';
import { formatPaymentReceipt } from '@/services/thermalPrinter';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';



interface ReceiptViewerProps {
    visible: boolean;
    onClose: () => void;
    receipt: string;
    receiptData?: any; // Start optional to avoid strict type refactor across all files immediately
    title?: string;
    onConfirm?: () => Promise<void> | void;
}

/**
 * Receipt Viewer Component
 * Displays formatted thermal printer receipt in the app
 * Uses external printer apps for printing (e.g., RawBT Print Service)
 */
export default function ReceiptViewer({ visible, onClose, receipt, receiptData, title, onConfirm }: ReceiptViewerProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Default title if not provided
    const displayTitle = title || "Kitchen Receipt";

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

            if (receiptData) {
                try {
                    const formattedReceipt = formatPaymentReceipt(receiptData);
                    await intentPrinterService.printViaRawBT(formattedReceipt);
                } catch (err: any) {
                    console.error('Print Failed:', err);
                    await intentPrinterService.printViaRawBT(receipt);
                }
            } else {
                // Simple Text Printing (Kitchen or others without explicit data structure)
                await intentPrinterService.printViaRawBT(receipt);
            }

        } catch (error: any) {
            Alert.alert('Print Error', error.message || 'Failed to print receipt');
        } finally {
            setPrinting(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: receipt,
                title: displayTitle,
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
                            <Text style={styles.headerTitle}>{displayTitle}</Text>
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
                            {(() => {
                                // Split receipt into lines
                                const lines = receipt.split('\n');
                                // Assuming first 3 non-empty lines are header (Name, Title, Date)
                                // We need to be careful with empty lines if any.
                                // formatPaymentReceipt starts with \n, so line 0 is empty.
                                // line 1: THE CHEEZE TOWN, line 2: Title, line 3: Date.

                                // Let's find index where divider starts
                                const dividerIndex = lines.findIndex(l => l.includes('=====') || l.includes('-----'));

                                let headerLines: string[] = [];
                                let bodyText = receipt;

                                if (dividerIndex > 0) {
                                    // Extract header lines (trimming whitespace/centering)
                                    headerLines = lines.slice(0, dividerIndex).filter(l => l.trim().length > 0).map(l => l.trim());
                                    // Reconstruct body
                                    bodyText = lines.slice(dividerIndex).join('\n');
                                }

                                return (
                                    <>
                                        <View style={styles.headerContainer}>
                                            {/* Logo removed as per request */}
                                            <View style={styles.headerTextContainer}>
                                                {headerLines.map((line, index) => (
                                                    <Text key={index} style={[
                                                        styles.receiptHeaderText,
                                                        index === 0 && styles.receiptRestaurantName
                                                    ]}>
                                                        {line}
                                                    </Text>
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.receiptText}>{bodyText}</Text>
                                    </>
                                );
                            })()}
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
                                    <Text style={styles.printButtonText}>{t('common.print')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.shareButton]}
                            onPress={handleShare}
                            disabled={loading || printing}
                        >
                            <Share2 size={18} color="#FFFFFF" />
                            <Text style={styles.shareButtonText}>{t('common.share')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.doneButton]}
                            onPress={handleDone}
                            disabled={loading || printing}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.doneButtonText}>{t('common.done')}</Text>
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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    logo: {
        width: 45,
        height: 45,
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    receiptHeaderText: {
        fontFamily: Platform.select({
            ios: 'Courier',
            android: 'monospace',
            default: 'monospace',
        }),
        fontSize: 12,
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 2,
    },
    receiptRestaurantName: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    receiptText: {
        fontFamily: Platform.select({
            ios: 'Courier',
            android: 'monospace',
            default: 'monospace',
        }),
        fontSize: 10,
        lineHeight: 14,
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
