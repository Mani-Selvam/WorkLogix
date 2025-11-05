# ⚠️ Critical Fixes Required for WorkLogix

## ✅ FIXED: Email Recipient Issue

**Problem:** Report notification emails were being sent to a hardcoded email address (`maniselvam2023@gmail.com`) instead of the company admin's email.

**Solution:** ✅ Fixed! Now emails are sent to the **company's registered email address** (the company admin).

**What Changed:**
- Updated `sendReportNotification()` function to accept `adminEmail` parameter
- Modified report creation route to fetch company email and pass it to the notification
- Now when users submit reports, the company admin receives the notification at their registered email

---

## 🔴 Issue #1: Gmail App Password Invalid

**Current Problem:** Email verification links are NOT being sent because Gmail is rejecting the password.

**Error in Logs:**
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

### ✅ How to Fix:

**Step 1: Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" 
3. Click "Turn On" and follow the setup

**Step 2: Generate Gmail App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. If you don't see this option, make sure 2-Step Verification is enabled first
3. Select:
   - **App:** Mail
   - **Device:** Other (Custom name) → Type "WorkLogix"
4. Click **Generate**
5. Google will show you a 16-character password like: `abcd efgh ijkl mnop`

**Step 3: Update Replit Secret**
1. In your Replit project, click **Tools** → **Secrets**
2. Find the secret named `EMAIL_PASS`
3. **Delete** the current value
4. **Paste** the 16-character password (remove all spaces)
   - Example: `abcdefghijklmnop` (no spaces)
5. Click **Save**

**Step 4: Restart**
- The application will automatically restart and pick up the new password
- Email verification will start working immediately

---

## 🔴 Issue #2: Google OAuth Callback URL Not Configured

**Current Problem:** Google Sign-In fails with 403 error - "You don't have access to this page"

**Why:** Your Google Cloud Console doesn't have the correct callback URL configured for your Replit environment.

### ✅ How to Fix:

**Your Callback URL:**
```
https://44b9b16e-0caf-4f38-9f3a-9a1ee03ba36b-00-2yiffpbz94k68.picard.replit.dev/api/auth/google/callback
```

**Steps:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (the one with your GOOGLE_CLIENT_ID)
3. Click the **Edit** button (pencil icon)
4. Scroll to **Authorized redirect URIs**
5. Click **+ ADD URI**
6. Paste:
   ```
   https://44b9b16e-0caf-4f38-9f3a-9a1ee03ba36b-00-2yiffpbz94k68.picard.replit.dev/api/auth/google/callback
   ```
7. Click **Save**
8. Wait 5-10 minutes for Google to propagate the changes

**Note:** If your Replit domain changes, you'll need to update this URL again.

---

## 📧 Email Flow After Fixes

Once both issues are fixed, here's what will happen:

### Manual Registration:
1. User fills out registration form
2. ✅ Verification email sent to **user's email** from `maniselvam2023@gmail.com`
3. User clicks verification link in email
4. ✅ Company Server ID email sent to **user's email**
5. User can now log in

### Google Sign-In Registration:
1. User clicks "Register with Google"
2. Google authentication (no verification needed - Google already verified)
3. ✅ Company Server ID email sent to **user's email** from `maniselvam2023@gmail.com`
4. User can now log in

### Report Submission:
1. Company member submits a report
2. ✅ Notification email sent to **company admin's email** from `maniselvam2023@gmail.com`
3. Company admin receives notification about the new report

---

## 🧪 Testing After Fixes

### Test Email Verification:
1. Try registering a new company with manual registration
2. Check the email inbox for the verification link
3. Click the link and verify it works
4. Check for the Company Server ID email

### Test Google Sign-In:
1. Click "Register with Google"
2. Select your Google account
3. Should redirect back successfully
4. Check email for Company Server ID

### Test Report Notifications:
1. Log in as a company member
2. Submit a report
3. Company admin should receive email notification

---

## ✅ Summary

**What I Fixed:**
- ✅ Report notification emails now go to company admin (not hardcoded)

**What You Need to Fix:**
- 🔴 Update `EMAIL_PASS` with valid Gmail App Password
- 🔴 Add callback URL to Google Cloud Console

**Once Fixed:**
- ✅ Email verification will work
- ✅ Google Sign-In will work
- ✅ All emails will be sent from `maniselvam2023@gmail.com`
- ✅ All emails will be sent to the correct recipients (users and company admins)

---

## 📞 Need Help?

If you encounter any issues:
1. Check the application logs for error messages
2. Verify the Gmail App Password is correct (no spaces)
3. Make sure the Google OAuth callback URL exactly matches
4. Wait 5-10 minutes after updating Google OAuth settings

Let me know once you've updated both secrets and I'll help you test!
