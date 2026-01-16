# Email Configuration Setup for Product Inquiry Form

## Overview
The product inquiry form now sends emails to both the company and the customer when an inquiry is submitted.

## Features
- ✅ Company receives detailed inquiry notification with all customer information
- ✅ Customer receives professional confirmation email
- ✅ Beautiful HTML email templates with brand colors
- ✅ Automatic email validation
- ✅ Error handling and user feedback

## Email Setup Instructions

### 1. Configure Environment Variables

Create or update your `.env.local` file in the project root with the following variables:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
COMPANY_EMAIL=info@yourcompany.com
```

### 2. Gmail Setup (Recommended for Testing)

If using Gmail:

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as your `SMTP_PASSWORD` (not your regular Gmail password)

3. **Update .env.local**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   COMPANY_EMAIL=your-business-email@gmail.com
   ```

### 3. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your-password
```

### 4. Test the Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to the products page**
   - Go to http://localhost:3000/products
   - Or check the featured products on the homepage

3. **Submit a test inquiry**
   - Click "Inquiry Product" on any product card
   - Fill out the form with your test email
   - Click "Submit Inquiry"

4. **Check your emails**
   - Company email should receive the detailed inquiry
   - Customer email should receive the confirmation

## Email Templates

### Company Email Includes:
- Product name and category
- Customer's full contact information
- Complete inquiry message
- Timestamp of submission

### Customer Email Includes:
- Thank you message
- Product confirmation
- What to expect next
- Company contact information
- Professional branding

## Troubleshooting

### "Failed to send inquiry" Error

**Possible Causes:**
1. Incorrect SMTP credentials
2. 2-Factor Authentication not enabled (Gmail)
3. App password not generated (Gmail)
4. Firewall blocking SMTP port
5. Email provider security settings

**Solutions:**
- Double-check `.env.local` file exists and has correct values
- Restart development server after changing environment variables
- Check server console for detailed error messages
- Verify SMTP settings with your email provider

### Gmail "Less Secure Apps" Error
- Gmail no longer supports "Less Secure Apps"
- You MUST use App Passwords with 2FA enabled
- Regular passwords will not work

### Emails Not Arriving
1. Check spam/junk folder
2. Verify email addresses in `.env.local`
3. Check server console for errors
4. Try a different email provider for testing

## Production Deployment

### Recommended Email Services for Production:
1. **SendGrid** - Free tier: 100 emails/day
2. **Mailgun** - Free tier: 5,000 emails/month
3. **Amazon SES** - Pay as you go
4. **Postmark** - Specialized in transactional emails

### Environment Variables for Production:
Ensure all SMTP variables are set in your hosting platform:
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- AWS: Set in your deployment configuration

## Security Best Practices

✅ Never commit `.env.local` to version control
✅ Use App Passwords instead of regular passwords
✅ Rotate SMTP credentials periodically
✅ Use a dedicated email account for automated emails
✅ Monitor email sending limits
✅ Keep nodemailer package updated

## Support

For issues or questions:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Test with a different email provider
4. Ensure nodemailer is properly installed: `npm list nodemailer`

---

**Installation Complete!** 🎉

Your product inquiry form is now ready to send professional emails to both customers and your company.
