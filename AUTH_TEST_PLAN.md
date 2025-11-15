# Sabitek Auth System Test Plan

## ✅ Password Reset Flow Test

### Steps:
1. Go to `/auth/login`
2. Click "Forgot password?"
3. Enter your email address
4. Check your email for reset link
5. Click the reset link in email

### Expected Results:
- You should see "Verifying reset link..." for 1-3 seconds
- Then the password reset form should appear
- Enter new password (min 8 characters)
- Click "Reset Password"
- See success message "Password Reset Successful!"
- Auto-redirect to login after 3 seconds
- Login with new password should work

### Console Logs to Verify:
```
[RESET] Starting recovery session validation...
[RESET] URL params: { hasToken: true, type: 'recovery' }
[RESET] Session not ready, setting up auth state listener...
[RESET] Auth state changed: SIGNED_IN
[RESET] ✅ Recovery session established via auth state change
[RESET] Updating password for user: [email]
[RESET] ✅ Password updated successfully
```

---

## ✅ Email Confirmation Flow Test

### Steps:
1. Go to `/auth/register`
2. Sign up with new email
3. Check email for confirmation link
4. Click the confirmation link

### Expected Results:
- You should see "Verifying your email..." briefly
- Then see "Email Confirmed!" success message
- Green checkmark icon
- "Your email has been verified" message
- "Go to Login" button
- Clicking button takes you to login page

### Console Logs to Verify:
```
[CALLBACK] Type: signup Code: present
[CALLBACK] Session already exists for: [email]
[CALLBACK] Email confirmed! Showing success message
```
OR
```
[CALLBACK] Exchanging code for session...
[CALLBACK] ✅ Code exchanged successfully!
[CALLBACK] Email confirmed! Showing success message
```

---

## 🔍 What Fixed the Issues

### Password Reset Fix:
1. **Added `onAuthStateChange` listener** - Handles async session establishment
2. **Check hash params first** - Validates recovery token exists
3. **Immediate session check** - In case it's already established
4. **Fallback with timeout** - Final check after 3 seconds
5. **Proper cleanup** - Unsubscribes from auth events

### Email Confirmation Fix:
1. **Changed redirect URL** - From `/auth/login` to `/auth/callback` in signup
2. **Callback page already handles properly** - Has all the right logic

---

## 📝 Key Points

### How Supabase PKCE Flow Works:
1. Email contains: `#access_token=xxx&type=recovery` or `#access_token=xxx&type=signup`
2. Supabase client with `detectSessionInUrl: true` auto-detects these tokens
3. Session establishment is ASYNC - takes 1-3 seconds
4. Must use `onAuthStateChange` to detect when ready

### Why Previous Attempts Failed:
- **Race condition** - Checking for session before it was established
- **No fallback** - If immediate check failed, no retry mechanism
- **Wrong redirect** - Signup emails going to `/auth/login` instead of callback

---

## 🚀 Production Checklist

- [ ] Test password reset with real email
- [ ] Test signup confirmation with real email
- [ ] Test cross-device (request on phone, click link on desktop)
- [ ] Test with slow network (throttle to 3G)
- [ ] Check all console logs appear correctly
- [ ] Verify session is cleared after password reset
- [ ] Confirm user can login with new password

---

## 🎯 Success Metrics

1. **Password Reset**: User sees form within 3 seconds of clicking link
2. **Email Confirmation**: User sees success message, not infinite spinner
3. **No Errors**: No "invalid or expired" messages for valid links
4. **Cross-Device**: Works even when email opened on different device
5. **Consistent**: Works every time, not intermittently

---

## 📧 Email Link Formats

### Password Reset:
```
https://[your-domain]/auth/reset-password#access_token=[token]&type=recovery&refresh_token=[token]
```

### Email Confirmation:
```
https://[your-domain]/auth/callback#access_token=[token]&type=signup&refresh_token=[token]
```
OR (PKCE with code):
```
https://[your-domain]/auth/callback?code=[code]&type=signup
```

Both formats are handled correctly now.

---

## 🔧 Debug Mode

If issues persist, check browser console for these logs:
- `[RESET]` - Password reset flow
- `[CALLBACK]` - Email confirmation flow
- `Auth event:` - Supabase auth state changes

The logs will tell you exactly where the flow is failing.