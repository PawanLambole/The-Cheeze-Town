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
import { X, CreditCard, Wallet, CheckCircle, Download, Share2, Clock, Smartphone, TicketPercent } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import QRPaymentModal from './QRPaymentModal';
import { PaymentStatus } from '../services/razorpayService';
import { supabase } from '@/services/database';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    amount: number;
    customerName?: string;
    customerPhone?: string;
    onPaymentSuccess: (transactionId: string, method: string) => void;
}

type PaymentMethod = 'cash' | 'razorpay' | null;
type PaymentStep = 'select' | 'qr_code' | 'receipt';



export default function PaymentModal({
    visible,
    onClose,
    orderId,
    amount,
    customerName,
    customerPhone,
    onPaymentSuccess,
}: PaymentModalProps) {
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
    const [currentStep, setCurrentStep] = useState<PaymentStep>('select');
    const [isProcessing, setIsProcessing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(customerPhone || '');
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);

    // Discount State
    const [couponCode, setCouponCode] = useState('');
    const [discountReceived, setDiscountReceived] = useState(0);
    const [discountType, setDiscountType] = useState('');
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [appliedOfferId, setAppliedOfferId] = useState<string | null>(null);

    const finalAmount = Math.max(0, amount - discountReceived);

    const resetState = () => {
        setSelectedMethod(null);
        setCurrentStep('select');
        setIsProcessing(false);
        setPhoneNumber(customerPhone || '');
        setTransactionId('');
        setPaymentMethod('');
        setCheckingStatus(false);
        setQrValue('');
        setCouponCode('');
        setDiscountReceived(0);
        setDiscountType('');
        setIsCouponApplied(false);
        setAppliedOfferId(null);
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





    // Manual verification for cash payment
    const processCashPayment = async () => {
        setIsProcessing(true);
        try {
            // Generate a simple transaction ID for cash payment
            const txnId = `CASH${Date.now()}${Math.floor(Math.random() * 1000)}`;

            setTransactionId(txnId);
            setPaymentMethod('Cash');
            setCurrentStep('receipt');
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

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Alert.alert(t('common.error'), t('payment.enterCoupon'));
            return;
        }

        setIsProcessing(true);
        try {
            const now = new Date().toISOString();
            const { data: offerResult, error } = await supabase
                .from('offers' as any)
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_to', now)
                .single();

            const offer = offerResult as any;

            if (error || !offer) {
                Alert.alert(t('common.error'), t('payment.invalidCoupon'));
                setIsProcessing(false);
                return;
            }

            if (offer.min_bill_amount && amount < offer.min_bill_amount) {
                Alert.alert(t('common.error'), `Minimum bill amount of ₹${offer.min_bill_amount} required`);
                setIsProcessing(false);
                return;
            }

            let discount = 0;
            if (offer.type === 'percentage_bill') {
                discount = (amount * offer.value) / 100;
            } else if (offer.type === 'percentage_item') {
                // Assuming amount is sum of items, treating same as bill % for now as per simpler request logic
                // For stricter item-level, we'd need order items passed in props. 
                // Using bill % logic for "10% on each item" effectively equals 10% on total.
                discount = (amount * offer.value) / 100;
            } else {
                // Item specific logic would go here if we had item details
                Alert.alert(t('common.error'), 'Item-specific offers not fully supported in this view yet.');
                setIsProcessing(false);
                return;
            }

            if (offer.max_discount_amount && discount > offer.max_discount_amount) {
                discount = offer.max_discount_amount;
            }

            setDiscountReceived(discount);
            setDiscountType(offer.code);
            setIsCouponApplied(true);
            setAppliedOfferId(offer.id);
            Alert.alert(t('common.success'), t('payment.couponApplied'));

        } catch (err) {
            console.error(err);
            Alert.alert(t('common.error'), t('payment.unexpected'));
        } finally {
            setIsProcessing(false);
        }
    };

    const [offers, setOffers] = useState<any[]>([]);
    const [showOffersModal, setShowOffersModal] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchActiveOffers();
        }
    }, [visible]);

    const fetchActiveOffers = async () => {
        try {
            const now = new Date().toISOString();
            console.log('[PaymentModal] Fetching offers at:', now);
            const { data, error } = await supabase
                .from('offers' as any)
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_to', now);

            console.log('[PaymentModal] Offers query result:', { data, error, count: data?.length });
            if (data) {
                console.log('[PaymentModal] Offers found:', data.map((o: any) => ({ code: o.code, valid_from: o.valid_from, valid_to: o.valid_to })));
                setOffers(data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    };

    const handleSelectOffer = (code: string) => {
        setCouponCode(code);
        setShowOffersModal(false);
    };

    const renderSelectPayment = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Summary */}
            <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('payment.orderId')}</Text>
                    <Text style={styles.summaryValue}>#{orderId}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('payment.amountToPay')}</Text>
                    <Text style={styles.summaryValue}>₹{amount.toFixed(2)}</Text>
                </View>
                {isCouponApplied && (
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#10B981' }]}>{t('payment.discount')} ({discountType})</Text>
                        <Text style={[styles.summaryValue, { color: '#10B981' }]}>-₹{discountReceived.toFixed(2)}</Text>
                    </View>
                )}
                <View style={[styles.summaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 }]}>
                    <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#1F2937' }]}>{t('common.total')}</Text>
                    <Text style={styles.summaryAmount}>₹{finalAmount.toFixed(2)}</Text>
                </View>
            </View>

            {/* Coupon Section */}
            {!isCouponApplied && (
                <View style={styles.couponContainer}>
                    <View style={styles.couponInputWrapper}>
                        <TextInput
                            style={styles.couponInput}
                            placeholder={t('payment.haveCoupon')}
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.offersButton} onPress={() => setShowOffersModal(true)}>
                            <TicketPercent size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon} disabled={isProcessing}>
                        <Text style={styles.applyButtonText}>{t('payment.apply')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Payment Methods */}
            <Text style={styles.sectionTitle}>{t('payment.method')}</Text>



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
                    <Text style={styles.paymentMethodTitle}>{t('payment.cash')}</Text>
                    <Text style={styles.paymentMethodDesc}>{t('payment.cashDesc')}</Text>
                </View>
                {selectedMethod === 'cash' && (
                    <CheckCircle size={20} color="#FDB813" />
                )}
            </TouchableOpacity>

            {/* Razorpay UPI Payment */}
            <TouchableOpacity
                style={[
                    styles.paymentMethodCard,
                    selectedMethod === 'razorpay' && styles.paymentMethodCardActive,
                ]}
                onPress={() => handlePaymentMethodSelect('razorpay')}
            >
                <View style={styles.paymentMethodIcon}>
                    <Smartphone size={24} color={selectedMethod === 'razorpay' ? '#FDB813' : '#6B7280'} />
                </View>
                <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodTitle}>{t('payment.razorpay')}</Text>
                    <Text style={styles.paymentMethodDesc}>{t('payment.razorpayDesc')}</Text>
                </View>
                {selectedMethod === 'razorpay' && (
                    <CheckCircle size={20} color="#FDB813" />
                )}
            </TouchableOpacity>

            {/* Payment Details based on selected method */}


            {selectedMethod === 'cash' && (
                <View style={styles.paymentDetailsSection}>
                    <View style={styles.cashInfoBox}>
                        <Text style={styles.cashInfoText}>
                            Confirm that you have received ₹{finalAmount.toFixed(2)} in cash from the customer.
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
                                <Text style={styles.proceedButtonText}>{t('payment.confirmCash')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {selectedMethod === 'razorpay' && (
                <View style={styles.paymentDetailsSection}>
                    <View style={styles.cashInfoBox}>
                        <Text style={styles.cashInfoText}>
                            Generate a Razorpay QR code with automated payment verification. Payment status is checked every 3 seconds.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.proceedButton, isProcessing && styles.proceedButtonDisabled]}
                        onPress={() => setShowRazorpayModal(true)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Smartphone size={18} color="#FFFFFF" />
                                <Text style={styles.proceedButtonText}>{t('payment.generateRazorpay')}</Text>
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
                <Text style={styles.qrTitle}>{t('payment.scanToPay')}</Text>
                <Text style={styles.qrSubtitle}>{t('payment.scanToPaySubtitle')}</Text>
            </View>

            {/* Amount Display */}
            <View style={styles.qrAmountBox}>
                <Text style={styles.qrAmountLabel}>{t('payment.amountToPay')}</Text>
                <Text style={styles.qrAmountValue}>₹{finalAmount.toFixed(2)}</Text>
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
                <Text style={styles.qrCodeHint}>{t('payment.scanHint')}</Text>
            </View>

            {/* Payment Status */}
            {checkingStatus && (
                <View style={styles.statusBox}>
                    <ActivityIndicator size="small" color="#F59E0B" />
                    <Text style={styles.statusText}>{t('payment.waiting')}</Text>
                    <Text style={styles.statusSubtext}>{t('payment.waitingDesc')}</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.qrActions}>
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleManualVerification}
                >
                    <Text style={styles.verifyButtonText}>{t('payment.confirmed')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCurrentStep('select')}
                >
                    <Text style={styles.cancelButtonText}>{t('payment.changeMethod')}</Text>
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
                    <Text style={styles.successTitle}>{t('payment.success')}!</Text>
                    <Text style={styles.successSubtitle}>{t('payment.successSubtitle')}</Text>
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptCard}>
                    <Text style={styles.receiptTitle}>{t('payment.receiptTitle')}</Text>

                    <View style={styles.receiptDivider} />

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>{t('payment.orderId')}</Text>
                        <Text style={styles.receiptValue}>#{orderId}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>{t('payment.transactionId')}</Text>
                        <Text style={styles.receiptValue}>{transactionId}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>{t('payment.method')}</Text>
                        <Text style={styles.receiptValue}>{paymentMethod}</Text>
                    </View>

                    {customerName && (
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>{t('payment.customerName')}</Text>
                            <Text style={styles.receiptValue}>{customerName}</Text>
                        </View>
                    )}

                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>{t('payment.dateTime')}</Text>
                        <Text style={styles.receiptValue}>{currentDate}</Text>
                    </View>

                    <View style={styles.receiptDivider} />

                    <View style={styles.receiptTotalRow}>
                        <Text style={styles.receiptTotalLabel}>{t('payment.amountPaid')}</Text>
                        <Text style={styles.receiptTotalValue}>₹{finalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActions}>
                    <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                        <CheckCircle size={18} color="#FFFFFF" />
                        <Text style={styles.doneButtonText}>{t('payment.done')}</Text>
                    </TouchableOpacity>

                    <View style={styles.receiptSecondaryActions}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Download size={20} color="#6B7280" />
                            <Text style={styles.iconButtonText}>{t('payment.download')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Share2 size={20} color="#6B7280" />
                            <Text style={styles.iconButtonText}>{t('payment.share')}</Text>
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

            {/* Razorpay QR Payment Modal */}
            <QRPaymentModal
                visible={showRazorpayModal}
                onClose={() => setShowRazorpayModal(false)}
                amount={finalAmount}
                description={`Order #${orderId}`}
                orderId={orderId}
                onPaymentSuccess={(paymentDetails: PaymentStatus) => {
                    // Set transaction details
                    setTransactionId(paymentDetails.id);
                    setPaymentMethod('Razorpay UPI');
                    // Close Razorpay modal
                    setShowRazorpayModal(false);
                    // Show receipt
                    setCurrentStep('receipt');
                    // Notify parent component to mark order as completed
                    onPaymentSuccess(paymentDetails.id, 'Razorpay UPI');
                }}
            />

            {/* Offer Selection Modal */}
            <Modal visible={showOffersModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('payment.selectOffer')}</Text>
                            <TouchableOpacity onPress={() => setShowOffersModal(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {offers.filter(o => !o.min_bill_amount || amount >= o.min_bill_amount).length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>{t('payment.noApplicableOffers')}</Text>
                            ) : (
                                offers.filter(o => !o.min_bill_amount || amount >= o.min_bill_amount).map(offer => (
                                    <TouchableOpacity
                                        key={offer.id}
                                        style={styles.offerCard}
                                        onPress={() => handleSelectOffer(offer.code)}
                                    >
                                        <View>
                                            <Text style={styles.offerHeading}>{offer.heading || 'Offer'}</Text>
                                            <Text style={styles.offerCode}>{offer.code}</Text>
                                        </View>
                                        <View style={styles.offerValueBadge}>
                                            <Text style={styles.offerValueText}>{offer.value}% OFF</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    couponContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1F2937',
    },
    applyButton: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
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
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingRight: 8,
    },
    offersButton: {
        padding: 8,
    },
    offerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    offerHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    offerCode: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '700',
        letterSpacing: 1,
    },
    offerValueBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    offerValueText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
});
