# Quick Email Setup Guide

## Error: "Failed to send inquiry. Please try again later."

This error means the email service is not configured yet. Follow these steps:

## Step 1: Create .env.local file

Create a file named `.env.local` in your project root directory (same folder as package.json)

## Step 2: Add Email Configuration

Copy and paste this into your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
COMPANY_EMAIL=your-email@gmail.com
```

## Step 3: Gmail Setup (Easiest Option)

### For Gmail users:

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification" and turn it ON

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Windows Computer" (or your device)
   - Click "Generate"
   - Copy the 16-character password (looks like: xxxx xxxx xxxx xxxx)

3. **Update .env.local**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   COMPANY_EMAIL=your-gmail@gmail.com
   ```

## Step 4: Restart Development Server

**IMPORTANT:** You must restart the server after creating/editing .env.local

```bash
# Press Ctrl+C to stop the current server
# Then restart:
npm run dev
```

## Step 5: Test It

1. Go to http://localhost:3000/products
2. Click "Inquiry Product" on any product
3. Fill out the form
4. Submit

You should receive:
- ✅ Detailed inquiry email at COMPANY_EMAIL
- ✅ Confirmation email at customer's email address

## Alternative: Using Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
COMPANY_EMAIL=your-email@outlook.com
```

### Custom SMTP
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your-password
COMPANY_EMAIL=info@yourcompany.com
```

## Troubleshooting

### Still getting errors?

1. **Check the terminal/console** - Look for detailed error messages
2. **Verify .env.local exists** in the project root
3. **Restart the dev server** - Environment variables are only loaded on startup
4. **Check credentials** - Make sure email and password are correct
5. **Gmail users** - MUST use App Password, not regular password

### Common Issues:

**"SMTP credentials not configured"**
- .env.local file is missing or not in the right location
- Restart the development server

**"Email service configuration error"**
- Wrong email or password
- Gmail: Need to use App Password (not regular password)
- Gmail: 2FA must be enabled first

**"Failed to send company notification email"**
- SMTP host/port incorrect
- Check your email provider's SMTP settings
- Firewall blocking port 587

## Security Notes

- ✅ Never commit .env.local to Git (it's already in .gitignore)
- ✅ Use App Passwords for Gmail (more secure)
- ✅ Keep credentials private
- ✅ Use a dedicated email account for website forms

## Need Help?

Check the server console (terminal) for detailed error messages. The API now provides helpful error information during development.
