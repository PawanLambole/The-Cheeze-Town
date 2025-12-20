import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { X, CreditCard, Wallet, CheckCircle, Download, Share2, Clock } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { PhonePeGateway, ManualPayment } from '../services/phonepeService';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    amount: number;
    customerName?: string;
    customerPhone?: string;
    onPaymentSuccess: (transactionId: string, method: string) => void;
}

type PaymentMethod = 'gateway' | 'cash' | null;
type PaymentStep = 'select' | 'qr_code' | 'receipt';

// SuperMoney UPI Base Link
const SUPERMONEY_UPI_BASE = 'upi://pay?mode=02&ver=01&pa=9766573966%40superyes&pn=PAVAN+VITTHAL+LAMBOLE&txntype=pay&qrmedium=02&am=200&orgid=180032&sign=MEYCIQDwUgWpsfTJIyDk+D0PoMKJFtn8xeSLGwUQscHexz+xQwIhALUGip6v3ShopUI3PqJeA5KRig1Vx7fHGc/Pz6wSzpi0';

// Helper function to generate SuperMoney UPI link with dynamic amount
const generateSuperMoneyUPI = (amount: number): string => {
    // Replace the amount parameter in the UPI link
    return SUPERMONEY_UPI_BASE.replace(/am=\d+/, `am=${amount}`);
};

export default function PaymentModal({
    visible,
    onClose,
    orderId,
    amount,
    customerName,
    customerPhone,
    onPaymentSuccess,
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
    const [currentStep, setCurrentStep] = useState<PaymentStep>('select');
    const [isProcessing, setIsProcessing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(customerPhone || '');
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [qrValue, setQrValue] = useState('');

    const resetState = () => {
        setSelectedMethod(null);
        setCurrentStep('select');
        setIsProcessing(false);
        setPhoneNumber(customerPhone || '');
        setTransactionId('');
        setPaymentMethod('');
        setCheckingStatus(false);
        setQrValue('');
    };

    const handleClose = () => {
        if (currentStep === 'receipt') {
            // Payment is complete, notify parent
            onPaymentSuccess(transactionId, paymentMethod);
        }
        resetState();
        onClose();
    };

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
    };

    // Generate QR code for SuperMoney UPI payment
    const generatePhonePeQR = async () => {
        setIsProcessing(true);
        try {
            // Generate SuperMoney UPI string with the actual amount
            const upiString = generateSuperMoneyUPI(amount);

            // Generate a simple transaction ID
            const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

            setQrValue(upiString);
            setTransactionId(txnId);
            setPaymentMethod('UPI Payment');
            setCurrentStep('qr_code');

            // Note: Payment verification will be manual via "I Have Paid" button
            // Or you can implement automatic polling if you have a backend
        } catch (error) {
            Alert.alert('Error', 'Failed to generate payment QR code. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Poll payment status every 3 seconds
    const startPaymentStatusPolling = async (txnId: string) => {
        setCheckingStatus(true);
        let attempts = 0;
        const maxAttempts = 60; // Poll for 3 minutes max

        const pollInterval = setInterval(async () => {
            attempts++;

            if (attempts > maxAttempts) {
                clearInterval(pollInterval);
                setCheckingStatus(false);
                Alert.alert('Timeout', 'Payment verification timed out. Please check status manually.');
                return;
            }

            try {
                const status = await PhonePeGateway.checkPaymentStatus(txnId);
                if (status.success) {
                    clearInterval(pollInterval);
                    setCheckingStatus(false);
                    // Show receipt
                    setCurrentStep('receipt');
                }
            } catch (error) {
                // Continue polling on error
            }
        }, 3000); // Check every 3 seconds
    };

    // Manual verification for cash payment
    const processCashPayment = async () => {
        setIsProcessing(true);
        try {
            const response = await ManualPayment.recordCashPayment({
                orderId,
                amount,
                customerName,
            });

            if (response.success && response.transactionId) {
                setTransactionId(response.transactionId);
                setPaymentMethod('Cash');
                setCurrentStep('receipt');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to record cash payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualVerification = () => {
        Alert.alert(
            'Verify Payment',
            'Have you received the payment for this order?',
            [
                {
                    text: 'Yes, Received',
                    onPress: () => {
                        setCheckingStatus(false);
                        setCurrentStep('receipt');
                    },
                },
                {
                    text: 'Not Yet',
                    style: 'cancel',
                },
            ]
        );
    };

    const renderSelectPayment = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Summary */}
            <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order ID</Text>
                    <Text style={styles.summaryValue}>#{orderId}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount to Pay</Text>
                    <Text style={styles.summaryAmount}>₹{amount.toFixed(2)}</Text>
                </View>
            </View>

            {/* Payment Methods */}
            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            {/* PhonePe Gateway */}
            <TouchableOpacity
                style={[
                    styles.paymentMethodCard,
                    selectedMethod === 'gateway' && styles.paymentMethodCardActive,
                ]}
                onPress={() => handlePaymentMethodSelect('gateway')}
            >
                <View style={styles.paymentMethodIcon}>
                    <CreditCard size={24} color={selectedMethod === 'gateway' ? '#FDB813' : '#6B7280'} />
                </View>
                <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodTitle}>PhonePe / UPI</Text>
                    <Text style={styles.paymentMethodDesc}>Scan QR code to pay via any UPI app</Text>
                </View>
                {selectedMethod === 'gateway' && (
                    <CheckCircle size={20} color="#FDB813" />
                )}
            </TouchableOpacity>

            {/* Cash Payment */}
            <TouchableOpacity
                style={[
                    styles.paymentMethodCard,
                    selectedMethod === 'cash' && styles.paymentMethodCardActive,
                ]}
                onPress={() => handlePaymentMethodSelect('cash')}
            >
                <View style={styles.paymentMethodIcon}>
                    <Wallet size={24} color={selectedMethod === 'cash' ? '#FDB813' : '#6B7280'} />
                </View>
                <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodTitle}>Cash Payment</Text>
                    <Text style={styles.paymentMethodDesc}>Record cash payment manually</Text>
                </View>
                {selectedMethod === 'cash' && (
                    <CheckCircle size={20} color="#FDB813" />
                )}
            </TouchableOpacity>

            {/* Payment Details based on selected method */}
            {selectedMethod === 'gateway' && (
                <View style={styles.paymentDetailsSection}>
                    <View style={styles.cashInfoBox}>
                        <Text style={styles.cashInfoText}>
                            Click below to generate a UPI QR code. Customer can scan and pay ₹{amount.toFixed(2)}.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.proceedButton, isProcessing && styles.proceedButtonDisabled]}
                        onPress={generatePhonePeQR}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <CreditCard size={18} color="#FFFFFF" />
                                <Text style={styles.proceedButtonText}>Generate QR Code</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {selectedMethod === 'cash' && (
                <View style={styles.paymentDetailsSection}>
                    <View style={styles.cashInfoBox}>
                        <Text style={styles.cashInfoText}>
                            Confirm that you have received ₹{amount.toFixed(2)} in cash from the customer.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.proceedButton, isProcessing && styles.proceedButtonDisabled]}
                        onPress={processCashPayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Wallet size={18} color="#FFFFFF" />
                                <Text style={styles.proceedButtonText}>Confirm Cash Payment</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ height: 20 }} />
        </ScrollView>
    );

    const renderQRCode = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrContainer}>
            <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>Scan to Pay</Text>
                <Text style={styles.qrSubtitle}>Use any UPI app to scan and pay</Text>
            </View>

            {/* Amount Display */}
            <View style={styles.qrAmountBox}>
                <Text style={styles.qrAmountLabel}>Amount to Pay</Text>
                <Text style={styles.qrAmountValue}>₹{amount.toFixed(2)}</Text>
                <Text style={styles.qrOrderId}>Order #{orderId}</Text>
            </View>

            {/* QR Code */}
            <View style={styles.qrCodeWrapper}>
                <View style={styles.qrCodeContainer}>
                    {qrValue ? (
                        <QRCode
                            value={qrValue}
                            size={200}
                            backgroundColor="white"
                            color="#1F2937"
                        />
                    ) : (
                        <ActivityIndicator size="large" color="#FDB813" />
                    )}
                </View>
                <Text style={styles.qrCodeHint}>Scan with PhonePe, Google Pay, Paytm, or any UPI app</Text>
            </View>

            {/* Payment Status */}
            {checkingStatus && (
                <View style={styles.statusBox}>
                    <ActivityIndicator size="small" color="#F59E0B" />
                    <Text style={styles.statusText}>Waiting for payment...</Text>
                    <Text style={styles.statusSubtext}>This will automatically update once payment is received</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.qrActions}>
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleManualVerification}
                >
                    <Text style={styles.verifyButtonText}>Payment Confirmed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCurrentStep('select')}
                >
                    <Text style={styles.cancelButtonText}>Change Payment Method</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderReceipt = () => {
        const currentDate = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptContainer}>
                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                    <View style={styles.successIconCircle}>
                        <CheckCircle size={60} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>Thank you for your payment</Text>
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptCard}>
                    <Text style={styles.receiptTitle}>Payment Receipt</Text>

                    <View style={styles.receiptDivider} />

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Order ID</Text>
                        <Text style={styles.receiptValue}>#{orderId}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Transaction ID</Text>
                        <Text style={styles.receiptValue}>{transactionId}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Payment Method</Text>
                        <Text style={styles.receiptValue}>{paymentMethod}</Text>
                    </View>

                    {customerName && (
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Customer Name</Text>
                            <Text style={styles.receiptValue}>{customerName}</Text>
                        </View>
                    )}

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Date & Time</Text>
                        <Text style={styles.receiptValue}>{currentDate}</Text>
                    </View>

                    <View style={styles.receiptDivider} />

                    <View style={styles.receiptTotalRow}>
                        <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
                        <Text style={styles.receiptTotalValue}>₹{amount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActions}>
                    <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                        <CheckCircle size={18} color="#FFFFFF" />
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>

                    <View style={styles.receiptSecondaryActions}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Download size={20} color="#6B7280" />
                            <Text style={styles.iconButtonText}>Download</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Share2 size={20} color="#6B7280" />
                            <Text style={styles.iconButtonText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {currentStep === 'select' && 'Payment Options'}
                            {currentStep === 'qr_code' && 'Scan to Pay'}
                            {currentStep === 'receipt' && 'Payment Receipt'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {currentStep === 'select' && renderSelectPayment()}
                    {currentStep === 'qr_code' && renderQRCode()}
                    {currentStep === 'receipt' && renderReceipt()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
    },
    orderSummary: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    summaryAmount: {
        fontSize: 24,
        color: '#047857',
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    paymentMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    paymentMethodCardActive: {
        borderColor: '#FDB813',
        backgroundColor: '#FFFBEB',
    },
    paymentMethodIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentMethodInfo: {
        flex: 1,
    },
    paymentMethodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    paymentMethodDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    paymentDetailsSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        marginBottom: 16,
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FDB813',
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    proceedButtonDisabled: {
        backgroundColor: '#D1D5DB',
        opacity: 0.6,
    },
    proceedButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cashInfoBox: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    cashInfoText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    // QR Code Screen Styles
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    qrHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    qrAmountBox: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%',
    },
    qrAmountLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    qrAmountValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#047857',
        marginBottom: 4,
    },
    qrOrderId: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    qrCodeWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrCodeContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 16,
    },
    qrCodeHint: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 250,
    },
    statusBox: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FDB813',
        width: '100%',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
        marginTop: 12,
        marginBottom: 4,
    },
    statusSubtext: {
        fontSize: 12,
        color: '#92400E',
        textAlign: 'center',
    },
    qrActions: {
        width: '100%',
        gap: 12,
    },
    verifyButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    // Receipt Screen Styles
    receiptContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    receiptCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        marginBottom: 24,
    },
    receiptTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    receiptDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    receiptLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    receiptValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    receiptTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#D1FAE5',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    receiptTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#047857',
    },
    receiptTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#047857',
    },
    receiptActions: {
        width: '100%',
        gap: 16,
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FDB813',
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    receiptSecondaryActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    iconButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
});
