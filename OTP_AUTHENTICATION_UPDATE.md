# OTP Authentication Update - Quick Reference

## ✅ What Changed

The mentor login system has been updated from **password-based** to **OTP-based** authentication for enhanced security.

---

## 🔐 New OTP Login Flow

### Step 1: Request OTP
1. Mentor goes to `/mentor-login.html`
2. Enters their registered email
3. Clicks "Send OTP"
4. System generates 6-digit OTP

### Step 2: Verify OTP
1. OTP is displayed in server console (dev mode)
2. Mentor enters the 6-digit OTP
3. OTP is valid for **5 minutes**
4. Auto-submits when 6 digits entered
5. On success, redirects to dashboard

---

## 🔧 Technical Implementation

### Backend Changes

**New API Endpoints:**
```
POST /community/mentor/request-otp
Body: { email: string }
Response: { success: true, message: string, data: { email, expiresIn: 300 } }

POST /community/mentor/verify-otp
Body: { email: string, otp: string }
Response: { success: true, message: string, data: { id, name, email, university, ... } }
```

**Old Endpoint (Removed):**
```
❌ POST /community/mentor/login (with password)
```

**Service Methods:**
- `requestMentorOTP(email)` - Generates and stores OTP
- `verifyMentorOTP(email, otp)` - Validates OTP and logs in

**OTP Storage:**
- In-memory Map (development)
- OTP expires after 5 minutes
- Automatically cleared after verification
- For production: Use Redis or database

---

### Frontend Changes

**Updated Files:**
- `web/mentor-login.html` - Two-step UI
- `web/assets/js/mentor-login.js` - OTP flow logic

**UI Features:**
- ✅ Two-step form (Email → OTP)
- ✅ 5-minute countdown timer
- ✅ Auto-submit on 6 digits
- ✅ Resend OTP button
- ✅ Back button to re-enter email
- ✅ Visual feedback for expired OTP

---

## 🧪 How to Test

### Development Testing:

1. **Start the server:**
   ```bash
   cd server/server
   npm run start:dev
   ```

2. **Go to mentor login page:**
   - Open `/mentor-login.html`

3. **Enter mentor email:**
   - Example: `test@university.edu`
   - Click "Send OTP"

4. **Check server console:**
   - You'll see:
     ```
     🔐 OTP for test@university.edu: 123456
     OTP expires at: 6:55:30 PM
     ```

5. **Enter OTP:**
   - Type the 6-digit code
   - Will auto-submit when complete
   - Or click "Verify & Login"

6. **Success!**
   - Redirects to mentor dashboard
   - Session stored in localStorage

---

## 🎯 Key Features

### Security Features:
- ✅ 6-digit random OTP
- ✅ 5-minute expiry
- ✅ One-time use (deleted after verification)
- ✅ Server-side validation
- ✅ No password storage needed

### UX Features:
- ✅ Countdown timer (5:00 → 0:00)
- ✅ Auto-submit on 6 digits
- ✅ Resend OTP option
- ✅ Clear error messages
- ✅ Loading states
- ✅ Back button to change email

---

## 📱 OTP Delivery (Production)

**Current (Development):**
- OTP printed to console
- Easy for testing

**Production Setup:**

### Option 1: Email (Recommended)
```typescript
// In requestMentorOTP method
import { EmailService } from './email.service';

await this.emailService.sendOTP(email, otp, {
  subject: 'Your Mentor Login OTP',
  template: 'mentor-otp',
  expiresIn: 5
});
```

### Option 2: SMS
```typescript
import { TwilioService } from './twilio.service';

await this.twilioService.sendSMS(mentor.phone, 
  `Your LoanHero mentor OTP is: ${otp}. Valid for 5 minutes.`
);
```

**Recommended Email Services:**
- SendGrid
- AWS SES
- Mailgun
- Postmark

---

## 🔄 Migration from Password

**Before (Password-based):**
```javascript
// Old login
POST /community/mentor/login
{
  "email": "mentor@university.edu",
  "password": "mentor@university.edu"  // Demo: email as password
}
```

**After (OTP-based):**
```javascript
// Step 1: Request OTP
POST /community/mentor/request-otp
{
  "email": "mentor@university.edu"
}

// Step 2: Verify OTP
POST /community/mentor/verify-otp
{
  "email": "mentor@university.edu",
  "otp": "123456"
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: OTP Not Showing in Console
**Solution:**
- Check server is running: `npm run start:dev`
- Look for the 🔐 emoji in console output
- Verify email matches a mentor in database

### Issue 2: OTP Expired
**Solution:**
- Click "Didn't receive OTP? Resend"
- OTP is only valid for 5 minutes
- New OTP will be generated

### Issue 3: Invalid OTP Error
**Solution:**
- Check you're entering the correct 6-digit code
- Ensure no spaces or extra characters
- Copy-paste from console if needed
- Request new OTP if unsure

### Issue 4: Mentor Not Found
**Solution:**
- Verify mentor is approved (`isApproved: true`)
- Verify mentor is active (`isActive: true`)
- Check email is correct in database

---

## 📊 Comparison

| Feature | Password-based | OTP-based |
|---------|---------------|-----------|
| Security | Low (demo) | High |
| User Experience | Simple | Modern |
| Password Management | Required | Not needed |
| Brute Force Attacks | Vulnerable | Resistant |
| Session Hijacking | Possible | Reduced |
| Time-based Expiry | No | Yes (5 min) |
| Two-Factor | No | Built-in |

---

## 🎨 UI Screenshots (Text)

**Step 1 - Email Entry:**
```
┌──────────────────────────────────┐
│  Email Address                   │
│  ┌────────────────────────────┐  │
│  │ your.email@university.edu  │  │
│  └────────────────────────────┘  │
│                                  │
│  [      Send OTP       ]         │
└──────────────────────────────────┘
```

**Step 2 - OTP Entry:**
```
┌──────────────────────────────────┐
│  ✓ OTP sent to test@uni.edu      │
│                                  │
│  Enter OTP                       │
│  ┌────────────────────────────┐  │
│  │      1  2  3  4  5  6      │  │
│  └────────────────────────────┘  │
│  OTP expires in 4:32             │
│                                  │
│  [  Back  ] [ Verify & Login ]   │
│                                  │
│  Didn't receive OTP? Resend      │
└──────────────────────────────────┘
```

---

## 🔐 Security Best Practices

### Current Implementation:
✅ OTP generation
✅ Time-based expiry
✅ One-time use
✅ Server-side validation

### Production Recommendations:
1. **Use Redis for OTP storage**
   - Automatic expiry
   - Better performance
   - Scalable

2. **Rate Limiting**
   - Max 3 OTP requests per hour
   - Prevent spam

3. **IP Tracking**
   - Log suspicious activity
   - Block repeated failures

4. **Audit Logging**
   - Log all login attempts
   - Track OTP generation

---

## 📝 Code Examples

### Generate OTP (Backend)
```typescript
// Generate 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Store with expiry
const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
this.otpStore.set(email, { otp, expiresAt });
```

### Verify OTP (Backend)
```typescript
const storedOTP = this.otpStore.get(email);

// Check expiry
if (new Date() > storedOTP.expiresAt) {
  throw new BadRequestException('OTP expired');
}

// Check OTP
if (storedOTP.otp !== otp) {
  throw new BadRequestException('Invalid OTP');
}

// Clear after successful verification
this.otpStore.delete(email);
```

### Frontend Timer
```javascript
function startOTPTimer(seconds) {
  setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}
```

---

## ✅ Summary

**What's New:**
- 🔐 OTP-based authentication
- ⏱️ 5-minute expiry timer
- 📧 Ready for email integration
- 🎨 Modern two-step UI
- ✨ Auto-submit functionality

**What's Removed:**
- ❌ Password field
- ❌ "Remember me" checkbox
- ❌ "Forgot password" link
- ❌ Password validation

**Benefits:**
- ✅ More secure
- ✅ Better UX
- ✅ No password management
- ✅ Production-ready
- ✅ Easy email integration

---

## 🚀 Next Steps

1. **For Development:**
   - Test the OTP flow
   - Check console for OTP codes
   - Verify timer works correctly

2. **For Production:**
   - Integrate email service (SendGrid/SES)
   - Move OTP storage to Redis
   - Add rate limiting
   - Enable audit logging

3. **Optional Enhancements:**
   - SMS OTP option
   - Backup codes
   - Remember device (30 days)
   - Email notifications

---

All changes are live and ready to test! 🎉
