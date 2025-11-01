# Stripe UPI Payment Integration Guide

## Overview
This application now supports UPI payments (Google Pay, PhonePe, Paytm) in addition to card payments, with automatic slot allocation and email notifications upon successful payment.

## Features Implemented

### 1. UPI Payment Methods
- **Card Payments**: Traditional credit/debit card payments
- **UPI Payments**: Google Pay, PhonePe, Paytm, and other UPI apps
- **Express Checkout**: PaymentRequest API for quick wallet payments
- **QR Code Payments**: Scan & pay option for UPI transactions

### 2. Secure Webhook Integration
- Automatic slot allocation when payment succeeds
- Webhook signature verification for security
- Idempotent payment processing (prevents duplicate slot allocation)
- Email notifications to both Super Admin and Company

### 3. Enhanced User Experience
- Multiple payment options displayed in one form
- Real-time payment status polling for UPI transactions
- Clear feedback for pending/processing/completed payments
- Automatic retry logic for failed payments

## Stripe Dashboard Setup

### Step 1: Configure Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   - **Development**: `https://<your-replit-domain>.repl.co/api/stripe-webhook`
   - **Production**: `https://<your-production-domain>/api/stripe-webhook`
4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your Replit Secrets as `STRIPE_WEBHOOK_SECRET`

### Step 2: Enable UPI in Stripe

1. Go to [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Under **India**, enable:
   - ✅ **UPI** (Google Pay, PhonePe, Paytm, etc.)
   - ✅ **Cards** (if not already enabled)
3. Save changes

### Step 3: Test Your Integration

#### Test Mode (Recommended First)
Use Stripe's test mode with these test UPI details:
- **Test UPI ID**: `success@razorpay` (simulates successful payment)
- **Test UPI ID**: `failure@razorpay` (simulates failed payment)

#### Live Mode
Switch to live mode after successful testing:
1. Update secrets with live keys (starting with `sk_live_` and `pk_live_`)
2. Update webhook with production domain
3. Test with small amount first

## Payment Flow

### For Company Admins:
1. Navigate to **Company Management**
2. Click **"Purchase Slots"**
3. Select slot type (Admin/Member) and quantity
4. Click **"Proceed to Payment"**
5. Choose payment method:
   - **Express Checkout**: Click Google Pay/PhonePe button (if available)
   - **UPI QR Code**: Click "Pay with UPI QR Code" and scan
   - **Card/UPI**: Fill in details manually and submit

### What Happens Behind the Scenes:
1. **Payment Intent Created**: Server creates a secure payment intent with UPI enabled
2. **User Pays**: User completes payment via chosen method
3. **Webhook Triggered**: Stripe sends `payment_intent.succeeded` event to your server
4. **Verification**: Server verifies webhook signature for security
5. **Slot Allocation**: Slots are automatically added to company account
6. **Notifications Sent**: 
   - Email to company with receipt and details
   - Email to Super Admin with payment notification
7. **Confirmation Displayed**: User sees success message with transaction details

## Security Features

### Webhook Security
- **Signature Verification**: Every webhook is verified using Stripe's signing secret
- **Idempotency**: Duplicate webhooks are detected and ignored
- **Metadata Validation**: Payment metadata is validated against database records

### Payment Security
- **Server-Side Pricing**: Prices are fetched from server to prevent tampering
- **Amount Verification**: Server validates payment amount matches expected total
- **Client Secret Protection**: Payment secrets are never exposed in logs or responses

## Troubleshooting

### Webhook Not Firing
1. Check webhook URL is accessible (test with `curl`)
2. Verify webhook secret is correctly set in Replit Secrets
3. Check Stripe Dashboard → Webhooks → Events for errors
4. Ensure your Replit app is not sleeping (upgrade to always-on if needed)

### Payment Succeeds But Slots Not Allocated
1. Check webhook logs in Stripe Dashboard
2. Verify webhook signature verification is passing
3. Check server logs for errors during slot allocation
4. Ensure database connection is stable

### UPI Payment Stuck on "Processing"
- UPI payments can take 1-3 minutes to confirm
- The app polls every 3 seconds for up to 60 seconds
- User can safely close the dialog; webhook will still allocate slots when payment succeeds

### Email Notifications Not Sending
1. Verify Resend API key is configured
2. Check sender email is verified in Resend
3. Email failures don't block payment processing (logged as warnings)

## API Endpoints

### `/api/create-payment-intent` (POST)
Creates a payment intent with UPI support.

**Request:**
```json
{
  "slotType": "admin" | "member",
  "quantity": 1
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentId": 123
}
```

### `/api/stripe-webhook` (POST)
Receives Stripe webhook events. **Do not call directly** - only Stripe should call this endpoint.

**Events Handled:**
- `payment_intent.succeeded`: Allocates slots and sends notifications

### `/api/verify-payment` (POST)
Fallback verification endpoint (called by frontend as backup).

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "paymentId": 123
}
```

## Environment Variables Required

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx          # Or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Or pk_live_xxx for production
```

## Testing Checklist

- [ ] Card payment completes successfully
- [ ] UPI payment via QR code works
- [ ] Express checkout (Google Pay) appears on supported devices
- [ ] Webhook allocates slots automatically
- [ ] Email notifications sent to company
- [ ] Email notifications sent to super admin
- [ ] Duplicate payments are prevented
- [ ] Failed payments show appropriate error messages
- [ ] Payment status polling works for UPI transactions

## Support

For issues with:
- **Stripe Integration**: Check [Stripe Documentation](https://stripe.com/docs/payments/payment-intents)
- **UPI Payments**: See [Stripe UPI Guide](https://stripe.com/docs/payments/upi)
- **Webhooks**: Read [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

## Next Steps

1. ✅ Set up webhook endpoint in Stripe Dashboard
2. ✅ Enable UPI payment method
3. ✅ Test in test mode
4. ✅ Switch to live mode when ready
5. ✅ Monitor webhook events in production
