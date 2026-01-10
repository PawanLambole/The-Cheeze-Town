import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { X, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Theme';
import { generateQRCode, checkPaymentStatus, cancelQRCode, RazorpayQRCode, PaymentStatus } from '@/services/razorpayService';

interface QRPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    amount: number;
    description: string;
    orderId?: string;
    tableNo?: string;
    onPaymentSuccess: (paymentDetails: PaymentStatus) => void;
}

export default function QRPaymentModal({
    visible,
    onClose,
    amount,
    description,
    orderId,
    tableNo,
    onPaymentSuccess,
}: QRPaymentModalProps) {
    const { t } = useTranslation();
    const [qrCode, setQrCode] = useState<RazorpayQRCode | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');
    const [checkInterval, setCheckInterval] = useState<number | null>(null);

    // Generate QR code when modal opens
    useEffect(() => {
        if (visible) {
            handleGenerateQR();
        } else {
            // Clean up when modal closes
            if (checkInterval) {
                clearInterval(checkInterval);
                setCheckInterval(null);
            }
            if (qrCode && paymentStatus === 'pending') {
                // Cancel QR code if payment not completed
                cancelQRCode(qrCode.id);
            }
            setQrCode(null);
            setPaymentStatus('pending');
        }
    }, [visible]);

    // Auto-check payment status every 3 seconds
    useEffect(() => {
        if (qrCode && paymentStatus === 'pending') {
            const interval = setInterval(() => {
                handleCheckPayment();
            }, 3000);
            setCheckInterval(interval);

            return () => {
                clearInterval(interval);
            };
        }
    }, [qrCode, paymentStatus]);

    const handleGenerateQR = async () => {
        setLoading(true);
        const result = await generateQRCode(amount, description, orderId, tableNo);

        if (result.success && result.qrCode) {
            setQrCode(result.qrCode);
        } else {
            Alert.alert('Error', result.error || 'Failed to generate QR code');
            onClose();
        }
        setLoading(false);
    };

    const handleCheckPayment = async () => {
        if (!qrCode || checking) return;

        setChecking(true);
        const result = await checkPaymentStatus(qrCode.id);

        if (result.success && result.status) {
            if (result.status.status === 'paid') {
                setPaymentStatus('paid');
                if (checkInterval) {
                    clearInterval(checkInterval);
                }
                // Call success callback immediately
                onPaymentSuccess(result.status);

                // Auto-close modal after 2 seconds
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        }
        setChecking(false);
    };

    const handleCancel = async () => {
        if (qrCode) {
            setLoading(true);
            await cancelQRCode(qrCode.id);
            setLoading(false);
        }
        if (checkInterval) {
            clearInterval(checkInterval);
        }
        onClose();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.minimalLoadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <Text style={styles.minimalLoadingText}>{t('payment.generating')}</Text>
                </View>
            );
        }

        if (paymentStatus === 'paid') {
            return (
                <View style={styles.minimalSuccessContainer}>
                    <CheckCircle size={48} color="#10B981" />
                    <Text style={styles.minimalSuccessText}>{t('payment.success')}</Text>
                </View>
            );
        }

        if (qrCode) {
            return (
                <View style={styles.minimalQRWrapper}>
                    {/* Razorpay QR Code Image - Direct */}
                    <View style={{ position: 'relative' }}>
                        <Image
                            source={{ uri: qrCode.image_url }}
                            style={styles.minimalQRImage}
                            resizeMode="contain"
                        />

                        {/* Tiny Loading Indicator Overlay */}
                        {checking && (
                            <View style={styles.checkingOverlay}>
                                <ActivityIndicator color={Colors.dark.primary} size="small" />
                            </View>
                        )}
                    </View>

                    {/* Minimal Amount Below QR */}
                    <Text style={styles.minimalAmount}>Rs.{amount.toFixed(2)}</Text>
                </View>
            );
        }

        return null;
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleCancel}>
            {loading ? (
                <View style={styles.fullscreenLoading}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            ) : paymentStatus === 'paid' ? (
                <View style={styles.fullscreenSuccess}>
                    <CheckCircle size={64} color="#10B981" />
                    <Text style={styles.successText}>{t('payment.success')}</Text>
                </View>
            ) : qrCode ? (
                <View style={styles.fullscreenQR}>
                    <Image
                        source={{ uri: qrCode.image_url }}
                        style={styles.fullscreenQRImage}
                        resizeMode="contain"
                    />

                    {/* Loading indicator when checking */}
                    {checking && (
                        <View style={styles.fullscreenCheckingOverlay}>
                            <ActivityIndicator color={Colors.dark.primary} size="small" />
                        </View>
                    )}

                    {/* Small close button in corner */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCancel}
                    >
                        <X size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            ) : null}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors.dark.card,
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 16,
    },
    amountDisplay: {
        backgroundColor: Colors.dark.secondary,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    amountLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    qrContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    qrImage: {
        width: 250,
        height: 250,
    },
    scanText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 8,
        marginBottom: 16,
    },
    pendingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.primary,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: Colors.dark.text,
        marginLeft: 8,
    },
    checkButton: {
        flexDirection: 'row',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 8,
    },
    checkButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: Colors.dark.secondary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 18,
        color: Colors.dark.textSecondary,
        marginBottom: 16,
    },
    autoCloseText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontStyle: 'italic',
    },
    // Compact Styles
    amountDisplayCompact: {
        backgroundColor: Colors.dark.secondary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    amountLabelCompact: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
    },
    amountValueCompact: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.text,
        marginTop: 2,
    },
    qrContainerCompact: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        alignSelf: 'center',
    },
    qrImageCompact: {
        width: 220,
        height: 220,
    },
    scanTextCompact: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    statusContainerCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: Colors.dark.secondary,
        borderRadius: 6,
        marginBottom: 16,
    },
    statusTextCompact: {
        fontSize: 12,
        color: Colors.dark.text,
        marginLeft: 8,
    },
    compactButtonsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    checkButtonCompact: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    checkButtonTextCompact: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButtonCompact: {
        flex: 1,
        backgroundColor: Colors.dark.secondary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cancelButtonTextCompact: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    // Ultra-Minimal Styles
    minimalLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    minimalLoadingText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 12,
    },
    minimalSuccessContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    minimalSuccessText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 12,
    },
    minimalQRWrapper: {
        alignItems: 'center',
    },
    minimalQRContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        position: 'relative',
    },
    minimalQRImage: {
        width: '90%',
        aspectRatio: 1,
        maxWidth: 400,
    },
    checkingOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 6,
        borderRadius: 20,
    },
    minimalAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
    },
    // Fullscreen Styles
    fullscreenLoading: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenSuccess: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
    },
    fullscreenQR: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenQRImage: {
        width: '95%',
        height: '95%',
        maxWidth: 500,
    },
    fullscreenCheckingOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
});
