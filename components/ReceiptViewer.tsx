import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Share, Platform, ActivityIndicator, Alert, FlatList } from 'react-native';
import { X, Share2, Printer, Check, AlertCircle, Bluetooth } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import thermalPrinterService, { PrinterDevice } from '@/services/thermalPrinterService';
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
 * Simulates a thermal receipt with monospace font and proper formatting
 */
export default function ReceiptViewer({ visible, onClose, receipt, title = 'Kitchen Receipt', onConfirm }: ReceiptViewerProps) {
    const [loading, setLoading] = useState(false);
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
    const [scanning, setScanning] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>(null);

    // Check for connected printer on mount
    useEffect(() => {
        const checkPrinter = async () => {
            const status = await thermalPrinterService.getConnectionStatus();
            setConnectedPrinter(status.device);
        };
        if (visible) {
            checkPrinter();
        }
    }, [visible]);

    const scanForPrinters = async () => {
        try {
            setScanning(true);
            const printers = await thermalPrinterService.scanDevices();
            setAvailablePrinters(printers);
        } catch (error) {
            Alert.alert('Scan Error', 'Failed to scan for printers. Please check Bluetooth permissions.');
        } finally {
            setScanning(false);
        }
    };

    const connectToPrinter = async (printer: PrinterDevice) => {
        try {
            setScanning(true);
            await thermalPrinterService.connectToPrinter(printer);
            setConnectedPrinter(printer);
            setShowPrinterModal(false);
            Alert.alert('Success', `Connected to ${printer.name}`);
        } catch (error) {
            Alert.alert('Connection Error', 'Failed to connect to printer. Please try again.');
        } finally {
            setScanning(false);
        }
    };

    const handlePrint = async () => {
        try {
            // Check if native printer is available
            if (!thermalPrinterService.isAvailable()) {
                Alert.alert(
                    'Build Required',
                    'Native printing requires a custom development build.\n\nPlease run: npx expo run:android',
                    [{ text: 'OK' }]
                );
                return;
            }

            setPrinting(true);

            // Try auto-connect first
            if (!connectedPrinter) {
                const connected = await thermalPrinterService.autoConnect();
                if (!connected) {
                    // Show printer selection modal
                    await scanForPrinters();
                    setShowPrinterModal(true);
                    setPrinting(false);
                    return;
                }
                // Update connected printer state
                const status = await thermalPrinterService.getConnectionStatus();
                setConnectedPrinter(status.device);
            }

            // Print receipt
            await thermalPrinterService.printReceipt(receipt);
            Alert.alert('Success', 'Receipt printed successfully!');
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
                                    <Text style={styles.printButtonText}>
                                        {connectedPrinter ? 'Print' : 'Print'}
                                    </Text>
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

            {/* Printer Selection Modal */}
            <Modal
                visible={showPrinterModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowPrinterModal(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.printerModalContainer}>
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Bluetooth size={20} color="#1F2937" />
                                <Text style={styles.headerTitle}>Select Printer</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowPrinterModal(false)} style={styles.closeButton}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.printerListContainer}>
                            {connectedPrinter && (
                                <View style={styles.connectedPrinterBanner}>
                                    <Check size={16} color="#10B981" />
                                    <Text style={styles.connectedPrinterText}>
                                        Connected: {connectedPrinter.name}
                                    </Text>
                                </View>
                            )}

                            {availablePrinters.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Printer size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyStateText}>No printers found</Text>
                                    <Text style={styles.emptyStateSubtext}>
                                        Make sure your printer is paired in Bluetooth settings
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={availablePrinters}
                                    keyExtractor={(item) => item.address}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.printerItem,
                                                connectedPrinter?.address === item.address && styles.printerItemConnected
                                            ]}
                                            onPress={() => connectToPrinter(item)}
                                            disabled={scanning}
                                        >
                                            <View style={styles.printerItemLeft}>
                                                <Printer size={20} color="#374151" />
                                                <View>
                                                    <Text style={styles.printerName}>{item.name}</Text>
                                                    <Text style={styles.printerAddress}>{item.address}</Text>
                                                </View>
                                            </View>
                                            {connectedPrinter?.address === item.address && (
                                                <Check size={20} color="#10B981" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>

                        <View style={styles.printerModalActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.scanButton]}
                                onPress={scanForPrinters}
                                disabled={scanning}
                            >
                                {scanning ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Bluetooth size={18} color="#FFFFFF" />
                                        <Text style={styles.scanButtonText}>Scan Again</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        flex: 1, // Take available height
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
        borderRadius: 0, // Look more like continuous paper
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Simulate thermal paper with slight shadow
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
        maxWidth: 380, // Approximate 80mm width typical max
    },
    receiptText: {
        fontFamily: Platform.select({
            ios: 'Courier',
            android: 'monospace',
            default: 'monospace',
        }),
        fontSize: 12, // Slightly larger for readability
        lineHeight: 16,
        color: '#1F2937',
        textAlign: 'left', // Ensure left alignment typical of receipts
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
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    confirmButton: {
        backgroundColor: Colors.dark.primary,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },
    // Printer Modal Styles
    printerModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    printerListContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    connectedPrinterBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#D1FAE5',
        borderBottomWidth: 1,
        borderBottomColor: '#A7F3D0',
    },
    connectedPrinterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#065F46',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
    },
    printerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    printerItemConnected: {
        backgroundColor: '#F0FDF4',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    printerItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    printerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    printerAddress: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    printerModalActions: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    scanButton: {
        backgroundColor: '#3B82F6',
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
