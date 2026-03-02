# 🔐 Gmail App Password Fix - Step by Step

## Current Error
```
535-5.7.8 Username and Password not accepted
```

This means the Gmail App Password in your `.env` file is **invalid or incorrect**.

---

## ✅ How to Fix It

### Step 1: Go to Gmail Security Settings
1. Open: **https://myaccount.google.com/security**
2. Sign in with: `mindfuljounralofficial@gmail.com`
3. Look for **"2-Step Verification"** on the left menu
   - If it says **"Add 2-Step Verification"** → Click it and complete setup first
   - If it says it's already enabled → Proceed to Step 2

### Step 2: Generate New App Password
1. Go to: **https://myaccount.google.com/apppasswords**
2. You should see a dropdown for "Select the app and device"
3. Select:
   - **App**: "Mail"
   - **Device**: "Windows Computer" (or your OS)
4. Click **"Generate"**
5. Google will show a **16-character password** in yellow highlight
   - Example: `abcd efgh ijkl mnop` (WITH SPACES)

### Step 3: Copy the Password (NO SPACES!)
1. Google shows: `abcd efgh ijkl mnop`
2. **REMOVE ALL SPACES** → `abcdefghijklmnop`
3. **Copy** the version WITHOUT spaces

### Step 4: Update Your .env File
1. Open: `backend/.env`
2. Find this line:
   ```
   GMAIL_APP_PASSWORD=yvckgxrfvtxuakoi
   ```
3. Replace with your new password (NO SPACES):
   ```
   GMAIL_APP_PASSWORD=YOUR_NEW_PASSWORD_HERE
   ```
4. Save the file (Ctrl+S)

### Step 5: Restart Backend Server
```powershell
cd backend
npm start
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "2-Step Verification not enabled" | Enable it first at https://myaccount.google.com/security |
| Password still doesn't work | Make sure there are NO spaces in the password |
| "Generate button not showing" | Your account might not have 2-Step enabled |
| Email still failing after restart | Check password again, might need to copy exactly |

---

## 🧪 Test Email Sending

After updating, the system will automatically send test emails to:
- Admin on crisis detection
- User when admin contacts them

You should see logs like:
```
✅ Email transporter initialized
📧 Sending crisis alert email to: mindfuljounralofficial@gmail.com
✅ Crisis alert email sent successfully!
```

> **OPTIONAL Fallback**
> If you want extra reliability, you can also configure SendGrid:
> 1. Create a free SendGrid account and obtain an API key.
> 2. Add `SENDGRID_API_KEY=SG.xxxxx` to the `.env` file.
> 3. The backend will automatically try SendGrid if Gmail fails.
>    This is especially handy during development or if Gmail credentials
>    get revoked or rate‑limited.

---

**Last Updated**: February 28, 2026
