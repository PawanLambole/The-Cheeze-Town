import { supabase } from '@/config/supabase';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || '';

// React Native compatible base64 encoding
function base64Encode(str: string): string {
    // Use btoa for browser/React Native environments
    return btoa(str);
}

export interface RazorpayQRCode {
    id: string;
    entity: string;
    created_at: number;
    name: string;
    usage: string;
    type: string;
    image_url: string;
    qr_string?: string;  // Raw UPI payment string
    payment_amount: number;
    status: string;
    description?: string;
    close_by?: number;
    closed_at?: number;
    customer_id?: string;
    notes?: Record<string, string>;
}

export interface PaymentStatus {
    id: string;
    status: 'paid' | 'pending' | 'failed' | 'expired';
    amount: number;
    method?: string;
    upi_transaction_id?: string;
    created_at: number;
}

/**
 * Generate QR Code using Razorpay API
 */
export async function generateQRCode(
    amount: number,
    description: string,
    orderId?: string,
    tableNo?: string
): Promise<{ success: boolean; qrCode?: RazorpayQRCode; error?: string }> {
    try {
        const auth = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

        const payload = {
            type: 'upi_qr',
            name: 'The Cheeze Town',
            usage: 'single_use',
            fixed_amount: true,
            payment_amount: amount * 100, // Convert to paise
            description: description,
            notes: {
                order_id: orderId || '',
                table_no: tableNo || '',
            },
            close_by: Math.floor(Date.now() / 1000) + (30 * 60), // Expires in 30 minutes
        };

        const response = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.description || 'Failed to generate QR code');
        }

        const qrCode: RazorpayQRCode = await response.json();

        return {
            success: true,
            qrCode,
        };
    } catch (error) {
        console.error('Error generating Razorpay QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Check payment status for a QR code
 */
export async function checkPaymentStatus(
    qrCodeId: string
): Promise<{ success: boolean; status?: PaymentStatus; error?: string }> {
    try {
        const auth = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

        const response = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrCodeId}/payments`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to check payment status');
        }

        const data = await response.json();

        // Check if any payment was successful
        if (data.count > 0 && data.items && data.items.length > 0) {
            const payment = data.items[0]; // Get the latest payment

            if (payment.status === 'captured' || payment.status === 'authorized') {
                return {
                    success: true,
                    status: {
                        id: payment.id,
                        status: 'paid',
                        amount: payment.amount / 100, // Convert from paise
                        method: payment.method,
                        upi_transaction_id: payment.acquirer_data?.upi_transaction_id,
                        created_at: payment.created_at,
                    },
                };
            }
        }

        return {
            success: true,
            status: {
                id: qrCodeId,
                status: 'pending',
                amount: 0,
                created_at: Date.now(),
            },
        };
    } catch (error) {
        console.error('Error checking payment status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Close/cancel a QR code
 */
export async function cancelQRCode(qrCodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

        const response = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrCodeId}/close`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to cancel QR code');
        }

        return { success: true };
    } catch (error) {
        console.error('Error canceling QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

export default {
    generateQRCode,
    checkPaymentStatus,
    cancelQRCode,
};
