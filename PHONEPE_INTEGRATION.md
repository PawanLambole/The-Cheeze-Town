# PhonePe Payment Integration Guide

## 📱 Integration Methods

This project supports **3 methods** of PhonePe integration:

### 1. PhonePe Payment Gateway API (Merchant Account Required)
**Best for**: Professional setup with automated settlements
**Requirements**: PhonePe Business/Merchant account

### 2. UPI Deep Link (No Merchant Account Needed)
**Best for**: Quick integration, direct UPI payments
**Requirements**: Any PhonePe UPI ID

### 3. Manual Payment Recording
**Best for**: Cash and QR code payments
**Requirements**: None

---

## 🚀 Quick Setup

### Method 1: PhonePe Payment Gateway API

#### Step 1: Get PhonePe Merchant Credentials

1. **Sign up for PhonePe Business**:
   - Visit: https://business.phonepe.com/
   - Sign up with business details
   - Complete KYC verification

2. **Get API Credentials**:
   - Login to PhonePe Business Dashboard
   - Go to **Developers** section
   - Get your:
     - `MERCHANT_ID`
     - `SALT_KEY`
     - `SALT_INDEX`

3. **Update Configuration**:
   ```typescript
   // In services/phonepeService.ts
   const PHONEPE_CONFIG = {
       MERCHANT_ID: 'YOUR_MERCHANT_ID_HERE',
       SALT_KEY: 'YOUR_SALT_KEY_HERE',
       SALT_INDEX: '1',
       BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Testing
       // BASE_URL: 'https://api.phonepe.com/apis/hermes', // Production
   };
   ```

#### Step 2: Install Dependencies

```bash
npm install expo-crypto
# or
npx expo install expo-crypto
```

#### Step 3: Usage Example

```typescript
import { PhonePeGateway } from '../services/phonepeService';

// Initiate payment
const response = await PhonePeGateway.initiatePayment({
    orderId: 'ORD001',
    amount: 500, // Amount in rupees
    customerPhone: '9876543210',
});

if (response.success) {
    // Payment page will open automatically
    console.log('Transaction ID:', response.transactionId);
    
    // Later, check payment status
    const status = await PhonePeGateway.checkPaymentStatus(response.transactionId);
}
```

---

### Method 2: UPI Deep Link (Simpler Option)

#### Step 1: Update UPI Configuration

```typescript
// In services/phonepeService.ts
const UPI_CONFIG = {
    UPI_ID: '9876543210@ybl', // Your PhonePe UPI ID
    MERCHANT_NAME: 'The Cheeze Town',
};
```

#### Step 2: Usage Example

```typescript
import { PhonePeUPI } from '../services/phonepeService';

// Open PhonePe app for payment
const response = await PhonePeUPI.initiateUPIPayment({
    orderId: 'ORD001',
    amount: 500,
});

// Customer completes payment in PhonePe app
// You manually verify and record the transaction
```

---

### Method 3: Manual Payment Recording

```typescript
import { ManualPayment } from '../services/phonepeService';

// Record cash payment
await ManualPayment.recordCashPayment({
    orderId: 'ORD001',
    amount: 500,
});

// Record UPI payment (after customer shows screenshot)
await ManualPayment.recordUPIPayment({
    orderId: 'ORD001',
    amount: 500,
}, 'UPI_TXN_ID_FROM_SCREENSHOT');
```

---

## 📋 Implementation Checklist

### For Gateway API Integration:
- [ ] Create PhonePe Business account
- [ ] Complete KYC verification
- [ ] Get Merchant ID and Salt Key
- [ ] Update `PHONEPE_CONFIG` in `phonepeService.ts`
- [ ] Install `expo-crypto` package
- [ ] Test in sandbox mode first
- [ ] Setup webhook endpoint for payment callbacks
- [ ] Switch to production URL when ready

### For UPI Deep Link Integration:
- [ ] Get your PhonePe UPI ID (e.g., 9876543210@ybl)
- [ ] Update `UPI_CONFIG` in `phonepeService.ts`
- [ ] Test payment flow
- [ ] Setup manual verification process

### For Manual Recording:
- [ ] Setup payment verification workflow
- [ ] Train staff to verify payments
- [ ] Implement transaction logging

---

## 🔒 Security Best Practices

1. **Never commit credentials**: Use environment variables
2. **Use HTTPS**: For all API calls
3. **Verify callbacks**: Validate payment webhooks
4. **Log transactions**: Keep audit trail
5. **Handle failures**: Implement retry logic

---

## 🧪 Testing

### Sandbox Testing (Method 1)
1. Use sandbox URL: `https://api-preprod.phonepe.com/apis/pg-sandbox`
2. Use test merchant credentials
3. Test payment flows

### UAT Testing (Method 2 & 3)
1. Use small amounts (₹1 - ₹10)
2. Test with real PhonePe account
3. Verify transactions manually

---

## 🎯 Recommended Approach

**For your restaurant "The Cheeze Town"**, I recommend:

### **Phase 1: Start with Method 2 (UPI Deep Link)**
- ✅ Quick to implement
- ✅ Works immediately
- ✅ No merchant account signup wait time
- ⚠️ Requires manual verification

### **Phase 2: Upgrade to Method 1 (Gateway API)**
- ✅ Automated settlements
- ✅ Professional receipt generation
- ✅ Better tracking
- ⚠️ Requires merchant account approval

---

## 📞 Support

- **PhonePe Business Support**: https://business.phonepe.com/support
- **Developer Docs**: https://developer.phonepe.com/docs
- **Integration Help**: Contact PhonePe business support team

---

## 💡 Tips

1. **For dine-in**: Use UPI QR code + Manual recording
2. **For delivery**: Use Gateway API for auto-confirmation
3. **Keep records**: Log all transactions for reconciliation
4. **Train staff**: On payment verification process
