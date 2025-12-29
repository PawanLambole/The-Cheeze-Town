# Razorpay QR Code Payment Integration

## Overview
Integrated Razorpay UPI QR code payment system that generates dynamic QR codes, auto-checks payment status, and allows payment cancellation.

## Features Implemented

### 1. **QR Code Generation** (`services/razorpayService.ts`)
- Generates dynamic UPI QR codes using Razorpay API
- QR codes are single-use and expire in 30 minutes
- Includes order details in QR metadata

### 2. **Payment Modal** (`components/QRPaymentModal.tsx`)
- Beautiful modal UI showing QR code
- Displays amount prominently
- Auto-checks payment status every 3 seconds
- Shows loading states and success confirmation
- Allows cancellation of pending payments

### 3. **Key Functions**

#### `generateQRCode(amount, description, orderId, tableNo)`
- Creates a new Razorpay QR code
- Amount in rupees (auto-converts to paise)
- Returns QR image URL

#### `checkPaymentStatus(qrCodeId)`
- Checks if QR code has been paid
- Returns payment details if successful
- Polls automatically every 3 seconds

#### `cancelQRCode(qrCodeId)`
- Closes/cancels the QR code
- Prevents further payments on that QR

## Usage Example

```typescript
import QRPaymentModal from '@/components/QRPaymentModal';
import { PaymentStatus } from '@/services/razorpayService';

// In your component
const [showQRModal, setShowQRModal] = useState(false);

const handlePaymentSuccess = (paymentDetails: PaymentStatus) => {
  console.log('Payment successful:', paymentDetails);
  // Update order status, close modal, etc.
  setShowQRModal(false);
};

// Render the modal
<QRPaymentModal
  visible={showQRModal}
  onClose={() => setShowQRModal(false)}
  amount={1250.50}
  description="Table 5 - Order #12345"
  orderId="12345"
  tableNo="5"
  onPaymentSuccess={handlePaymentSuccess}
/>
```

## Environment Variables Required

Make sure these are set in `.env.local`:

```
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
EXPO_PUBLIC_RAZORPAY_KEY_SECRET=xxxxx
```

## Payment Flow

1. User clicks "Pay with UPI"
2. Modal opens and generates QR code
3. QR code displayed with amount
4. User scans with any UPI app (GPay, PhonePe, Paytm, etc.)
5. System auto-checks payment every 3 seconds
6. On success: Shows checkmark, closes modal
7. On cancel: Closes QR code to prevent payment

## Features

✅ Dynamic QR code generation
✅ Auto payment verification (every 3s)
✅ Manual status check button
✅ Payment cancellation
✅ 30-minute expiry
✅ Beautiful success animation
✅ Loading states
✅ Error handling

## Next Steps

To integrate into your existing payment flow:

1. Add QRPaymentModal to your payment screen
2. Pass order details (amount, orderId, tableNo)
3. Handle onPaymentSuccess callback
4. Update order status in database
5. Print receipt or navigate to success screen
