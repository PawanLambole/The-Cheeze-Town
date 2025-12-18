import { Linking } from 'react-native';
import * as Crypto from 'expo-crypto';

// PhonePe Payment Gateway Configuration
// TODO: Replace with actual credentials from PhonePe Business Dashboard
const PHONEPE_CONFIG = {
    MERCHANT_ID: 'YOUR_MERCHANT_ID', // Get from PhonePe Dashboard
    SALT_KEY: 'YOUR_SALT_KEY', // Get from PhonePe Dashboard
    SALT_INDEX: '1', // Usually 1
    BASE_URL: 'https://api.phonepe.com/apis/hermes', // Production
    // BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // For testing
};

// PhonePe UPI Configuration (for UPI deep link)
const UPI_CONFIG = {
    UPI_ID: 'YOUR_UPI_ID@ybl', // Your PhonePe UPI ID (e.g., 9876543210@ybl)
    MERCHANT_NAME: 'The Cheeze Town',
};

interface PaymentRequest {
    orderId: string;
    amount: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
}

interface PaymentResponse {
    success: boolean;
    transactionId?: string;
    message: string;
    data?: any;
}

/**
 * METHOD 1: PhonePe Payment Gateway API Integration
 * Requires PhonePe merchant account and API credentials
 */
export class PhonePeGateway {

    /**
     * Initialize payment and get payment URL
     */
    static async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            // Generate unique transaction ID
            const transactionId = `TXN_${Date.now()}_${request.orderId}`;

            // Prepare payment request payload
            const paymentPayload = {
                merchantId: PHONEPE_CONFIG.MERCHANT_ID,
                merchantTransactionId: transactionId,
                merchantUserId: request.customerPhone || 'GUEST_USER',
                amount: request.amount * 100, // Convert to paise
                redirectUrl: `yourapp://payment/callback`, // Deep link for callback
                redirectMode: 'POST',
                callbackUrl: 'https://your-backend.com/phonepe/callback', // Your backend endpoint
                mobileNumber: request.customerPhone,
                paymentInstrument: {
                    type: 'PAY_PAGE', // Opens PhonePe payment page
                },
            };

            // Encode payload to base64
            const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

            // Generate X-VERIFY header (checksum)
            const stringToHash = base64Payload + '/pg/v1/pay' + PHONEPE_CONFIG.SALT_KEY;
            const sha256Hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                stringToHash
            );
            const xVerify = sha256Hash + '###' + PHONEPE_CONFIG.SALT_INDEX;

            // Make API call to PhonePe
            const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                },
                body: JSON.stringify({
                    request: base64Payload,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Open PhonePe payment page
                const paymentUrl = data.data.instrumentResponse.redirectInfo.url;
                await Linking.openURL(paymentUrl);

                return {
                    success: true,
                    transactionId: transactionId,
                    message: 'Payment initiated successfully',
                    data: data,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Payment initiation failed',
                };
            }
        } catch (error) {
            console.error('PhonePe payment error:', error);
            return {
                success: false,
                message: 'Error initiating payment',
            };
        }
    }

    /**
     * Check payment status
     */
    static async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
        try {
            const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${transactionId}`;

            // Generate X-VERIFY header
            const stringToHash = endpoint + PHONEPE_CONFIG.SALT_KEY;
            const sha256Hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                stringToHash
            );
            const xVerify = sha256Hash + '###' + PHONEPE_CONFIG.SALT_INDEX;

            const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                },
            });

            const data = await response.json();

            if (data.success && data.code === 'PAYMENT_SUCCESS') {
                return {
                    success: true,
                    transactionId: transactionId,
                    message: 'Payment successful',
                    data: data,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Payment failed or pending',
                    data: data,
                };
            }
        } catch (error) {
            console.error('Payment status check error:', error);
            return {
                success: false,
                message: 'Error checking payment status',
            };
        }
    }
}

/**
 * METHOD 2: Simple UPI Deep Link Integration
 * Works with any PhonePe UPI account (no merchant account needed)
 */
export class PhonePeUPI {

    /**
     * Open PhonePe app with UPI payment request
     */
    static async initiateUPIPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            // Generate transaction reference
            const txnRef = `TXN_${Date.now()}`;

            // Build UPI payment URL
            const upiUrl = `upi://pay?` +
                `pa=${UPI_CONFIG.UPI_ID}&` + // Payee UPI ID
                `pn=${encodeURIComponent(UPI_CONFIG.MERCHANT_NAME)}&` + // Payee name
                `am=${request.amount}&` + // Amount
                `cu=INR&` + // Currency
                `tn=${encodeURIComponent(`Payment for Order ${request.orderId}`)}&` + // Transaction note
                `tr=${txnRef}`; // Transaction reference

            // Check if PhonePe app is installed
            const canOpen = await Linking.canOpenURL('phonepe://');

            if (canOpen) {
                // Force open with PhonePe app
                const phonePeUrl = `phonepe://upi/${encodeURIComponent(upiUrl)}`;
                await Linking.openURL(phonePeUrl);
            } else {
                // Fallback to generic UPI
                await Linking.openURL(upiUrl);
            }

            return {
                success: true,
                transactionId: txnRef,
                message: 'UPI payment initiated. Please complete payment in PhonePe app.',
            };
        } catch (error) {
            console.error('UPI payment error:', error);
            return {
                success: false,
                message: 'Error opening PhonePe app',
            };
        }
    }

    /**
     * Generate PhonePe QR Code for payment
     */
    static generateQRCode(orderId: string, amount: number): string {
        const txnRef = `QR_${Date.now()}`;

        const upiString = `upi://pay?` +
            `pa=${UPI_CONFIG.UPI_ID}&` +
            `pn=${encodeURIComponent(UPI_CONFIG.MERCHANT_NAME)}&` +
            `am=${amount}&` +
            `cu=INR&` +
            `tn=${encodeURIComponent(`Order ${orderId}`)}&` +
            `tr=${txnRef}`;

        return upiString;
    }
}

/**
 * METHOD 3: Manual Cash/UPI Recording
 * For when customer pays via QR code or cash
 */
export class ManualPayment {

    static async recordCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const transactionId = `CASH_${Date.now()}`;

            // Here you would save to your database
            console.log('Recording cash payment:', {
                orderId: request.orderId,
                amount: request.amount,
                method: 'CASH',
                transactionId,
            });

            return {
                success: true,
                transactionId,
                message: 'Cash payment recorded successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error recording cash payment',
            };
        }
    }

    static async recordUPIPayment(request: PaymentRequest, upiTransactionId: string): Promise<PaymentResponse> {
        try {
            const transactionId = `UPI_${Date.now()}`;

            // Here you would save to your database
            console.log('Recording UPI payment:', {
                orderId: request.orderId,
                amount: request.amount,
                method: 'UPI',
                upiTransactionId,
                transactionId,
            });

            return {
                success: true,
                transactionId,
                message: 'UPI payment recorded successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error recording UPI payment',
            };
        }
    }
}

export default {
    PhonePeGateway,
    PhonePeUPI,
    ManualPayment,
};
