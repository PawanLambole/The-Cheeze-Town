import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Share, Platform } from 'react-native';
import { X, Share2, Printer } from 'lucide-react-native';

interface ReceiptViewerProps {
    visible: boolean;
    onClose: () => void;
    receipt: string;
    title?: string;
}

/**
 * Receipt Viewer Component
 * Displays formatted thermal printer receipt in the app
 * Simulates a thermal receipt with monospace font and proper formatting
 */
export default function ReceiptViewer({ visible, onClose, receipt, title = 'Kitchen Receipt' }: ReceiptViewerProps) {

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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Printer size={20} color="#1F2937" />
                            <Text style={styles.headerTitle}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Receipt Display */}
                    <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.receiptPaper}>
                            <Text style={styles.receiptText}>{receipt}</Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Share2 size={18} color="#FFFFFF" />
                            <Text style={styles.shareButtonText}>Share Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                            <Text style={styles.doneButtonText}>Done</Text>
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
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
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
        padding: 20,
    },
    receiptPaper: {
        backgroundColor: '#FAFAFA',
        padding: 20,
        borderRadius: 8,
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
    },
    receiptText: {
        fontFamily: Platform.select({
            ios: 'Courier',
            android: 'monospace',
            default: 'monospace',
        }),
        fontSize: 13,
        lineHeight: 18,
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    doneButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
