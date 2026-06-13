# Gmail App Password Setup Guide

## Current Issue
Gmail is rejecting the login credentials. You need to generate a fresh App Password.

## Step-by-Step Fix

### Step 1: Verify 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in with **viros.it.4@gmail.com**
3. Look for "2-Step Verification"
4. **If it's OFF**: Turn it ON (required for app passwords)
5. **If it's ON**: Continue to Step 2

### Step 2: Generate New App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with **viros.it.4@gmail.com**
3. Click "Select app" → Choose **"Mail"**
4. Click "Select device" → Choose **"Windows Computer"** (or "Other")
5. If prompted, give it a name like "VIROS Website"
6. Click **"Generate"**
7. Google will show a 16-character password like: **abcd efgh ijkl mnop**
8. **Copy this password** (you'll need it in Step 3)

### Step 3: Update .env.local

Open `.env.local` in the project root and update this line:

```env
SMTP_PASSWORD=your16characterpasswordhere
```

**IMPORTANT**: Remove ALL spaces from the password!

Example:
- ❌ WRONG: `SMTP_PASSWORD=abcd efgh ijkl mnop`
- ✅ CORRECT: `SMTP_PASSWORD=abcdefghijklmnop`

### Step 4: Restart Development Server

```bash
# Press Ctrl+C to stop the current server
npm run dev
```

### Step 5: Test

1. Go to http://localhost:3000/products
2. Click "Inquiry Product"
3. Fill and submit the form
4. Check your email!

## Alternative: Use a Different Email

If Gmail continues to have issues, you can use a different email service:

### Using Outlook/Hotmail

Update `.env.local`:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
COMPANY_EMAIL=your-email@outlook.com
```

## Troubleshooting

### "App passwords" option not available?
- 2FA must be enabled first
- Wait a few minutes after enabling 2FA
- Try signing out and back in

### Still getting errors?
- Make sure you're copying the password correctly (no spaces!)
- Try revoking old app passwords and creating a new one
- Check if the Gmail account has any security restrictions
- Verify the email address is correct

## Need Help?

Check the server terminal for detailed error messages after restarting.
