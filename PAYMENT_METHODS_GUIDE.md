# Payment Methods Configuration Guide

## ⚠️ Important: Google Pay Limitation in India

**Google Pay through Stripe is NOT available in India**. This is a hard restriction by Stripe that affects:
- ❌ Indian Stripe accounts
- ❌ Users with Indian IP addresses  
- ❌ Payments in INR currency

**Even if you enable Google Pay in your Stripe dashboard, it will not appear for Indian customers.**

## ✅ Solution: UPI (Includes Google Pay + PhonePe + Paytm)

Instead of Google Pay directly, you should use **UPI (Unified Payments Interface)** which includes:
- Google Pay (via UPI)
- PhonePe
- Paytm
- BHIM
- All other UPI apps
- QR Code payments

# Payment Methods Configuration Guide

## What I've Implemented

### ✅ Security Features
**Payment Amount Protection**: Your system already has robust security in place:
- All payment amounts are calculated **server-side only**
- Users cannot tamper with prices or amounts
- Server validates pricing against the database before creating any payment
- Stripe payment intent is created with the authoritative server-calculated amount

### ✅ Enhanced Payment Methods
I've enabled **Automatic Payment Methods** in your Stripe integration. This means:
- Google Pay (GPay) ✅
- Credit/Debit Cards ✅  
- UPI (PhonePe, Google Pay, Paytm) - requires activation
- QR Code Payments - requires activation
- And more payment methods based on customer location

## How to Enable Additional Payment Methods

To enable Google Pay, UPI, and QR code payments, follow these steps:

### 1. Access Your Stripe Dashboard
Go to: https://dashboard.stripe.com/account/payments/settings

### 2. Enable Payment Methods for India (INR)

#### Enable UPI (Includes Google Pay, PhonePe, Paytm + QR Codes)

**UPI is currently in PRIVATE BETA** - You need to request access:

1. **Contact Stripe Support**:
   - Go to: https://support.stripe.com
   - Or visit: https://stripe.com/docs/payments/real-time
   - Click "Contact us"

2. **Request Access**:
   - Subject: "Request access to UPI beta for India account"
   - Explain: You want to accept UPI payments (Google Pay, PhonePe, Paytm) for your Indian customers

3. **Once Approved**:
   - Go to **Settings → Payment methods** in Stripe Dashboard
   - Find **UPI** and enable it
   - No code changes needed - it will automatically appear in the payment form!

4. **What Customers Will See**:
   - UPI payment option at checkout
   - They can pay using Google Pay, PhonePe, Paytm, BHIM, or any UPI app
   - QR code option for scanning with their UPI app

#### ❌ Google Pay Direct (NOT Available)
- Do NOT enable Google Pay in Stripe Dashboard
- It will not work for Indian accounts or customers
- Use UPI instead (which includes Google Pay via UPI)

#### Enable Other Digital Wallets
You can also enable:
- **Paytm**
- **PhonePe** 
- **Amazon Pay**
- **BHIM UPI**

### 3. Test Mode vs Live Mode

**Test Mode** (Current):
- You're using test API keys (pk_test_... and sk_test_...)
- Can test payment flows without real money
- Some payment methods may be limited in test mode

**Live Mode** (Production):
- Switch to live API keys when ready to accept real payments
- All enabled payment methods will be available
- Requires full business verification

### 4. QR Code Payments

Once UPI is enabled:
1. Customers will see a QR code option during checkout
2. They can scan with any UPI app (Google Pay, PhonePe, Paytm, etc.)
3. Payment flows directly through their UPI app

## How Automatic Payment Methods Work

With `automatic_payment_methods: enabled`, Stripe automatically:

1. **Shows relevant payment methods** based on:
   - Customer's location (India)
   - Transaction currency (INR)
   - Transaction amount
   - Payment methods you've enabled in dashboard

2. **Optimizes the payment experience**:
   - Mobile users see Google Pay if available
   - Desktop users see card payments
   - UPI users see QR codes and UPI options

3. **Handles redirects automatically**:
   - For UPI apps that need redirect
   - For 3D Secure card verification
   - Returns user back to your app after payment

## Testing Payment Methods

### Test Cards (Always Work)
- Success: `4242 4242 4242 4242`
- Requires 3D Secure: `4000 0027 6000 3184`
- Declined: `4000 0000 0000 0002`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits
- ZIP: Any valid code

### Test UPI (After Enabling)
In test mode, Stripe provides test UPI IDs:
- Success: `success@razorpay`
- Failure: `failure@razorpay`

### Test Google Pay
In test mode on mobile:
- Google Pay should appear if enabled
- Use test cards to complete payment

## Current Implementation Status

✅ **Completed**:
- Server-side amount calculation and validation
- Automatic payment method detection
- Support for INR currency
- Card payments enabled
- Google Pay ready (needs Stripe dashboard activation)
- UPI ready (needs Stripe dashboard activation)
- QR code ready (needs UPI activation)

⏳ **Requires Your Action**:
1. Visit Stripe Dashboard to enable Google Pay
2. Request UPI access for Indian payments
3. Enable QR code payments through UPI
4. Complete business verification for live mode

## Important Notes

1. **Amount Security**: Users CANNOT change payment amounts - this is enforced server-side
2. **Currency**: Currently set to INR (Indian Rupees) - amounts are in paise (100 paise = 1 INR)
3. **Metadata**: Each payment includes company ID, slot type, and quantity for tracking
4. **Payment Verification**: Server validates all payments before adding slots to your company

## Next Steps

1. Log into your Stripe Dashboard: https://dashboard.stripe.com
2. Enable the payment methods you want to offer
3. Test the payment flow with test credentials
4. When ready, switch to live API keys for production

## Support

If you need help:
- Stripe Documentation: https://stripe.com/docs
- UPI Setup Guide: https://stripe.com/docs/payments/upi
- Google Pay Setup: https://stripe.com/docs/google-pay
- Payment Methods: https://stripe.com/docs/payments/payment-methods

