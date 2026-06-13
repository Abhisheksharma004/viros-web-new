# 🎂 Birthday Email System

Beautiful HTML email template for sending birthday wishes to employees.

## 📧 Email Template Features

- **Professional Design**: Modern, responsive HTML email with company branding
- **Celebration Theme**: Colorful design with birthday emojis and festive elements
- **Personalized Content**: Customizable with employee name, department, celebration time
- **Mobile Responsive**: Looks great on all devices
- **Company Branding**: Uses VIROS colors (#06b6d4 cyan and #06124f navy)

## 📁 Files Created

```
/email-templates/
  └── birthday-wishes.html          # Beautiful HTML email template

send-birthday-email.js              # Email sender utility with nodemailer
BIRTHDAY_EMAIL_GUIDE.md            # This guide
```

## 🚀 Setup Instructions

### 1. Install Required Package

```bash
npm install nodemailer
```

### 2. Configure Email Settings

Add these variables to your `.env.local` file:

```env
# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-company-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Company Information
COMPANY_NAME=VIROS
```

### 3. Setup Gmail App Password (if using Gmail)

1. Go to Google Account Settings → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

## 💻 Usage Examples

### Send Single Birthday Email

```javascript
const { sendBirthdayEmail } = require('./send-birthday-email');

// Send birthday email
await sendBirthdayEmail({
  to: 'employee@company.com',
  name: 'John Doe',
  celebrationTime: '3:00 PM',
  department: 'Engineering Team',
  companyAddress: '123 Business St, City, State',
  contactEmail: 'hr@company.com',
  phoneNumber: '+1 (555) 123-4567'
});
```

### Send Bulk Birthday Emails

```javascript
const { sendBulkBirthdayEmails } = require('./send-birthday-email');

const recipients = [
  {
    to: 'alice@company.com',
    name: 'Alice Johnson',
    department: 'Marketing Team'
  },
  {
    to: 'bob@company.com',
    name: 'Bob Smith',
    department: 'Sales Team'
  }
];

const results = await sendBulkBirthdayEmails(recipients);
console.log('Sent:', results);
```

### Automated Birthday Reminders

Integrate with your Birthday Reminder system:

```javascript
// Example: Send birthday emails automatically
const pool = require('./src/lib/db');
const { sendBirthdayEmail } = require('./send-birthday-email');

async function sendTodaysBirthdays() {
  try {
    // Get today's birthdays from database
    const [birthdays] = await pool.query(
      `SELECT * FROM birthdays 
       WHERE MONTH(date) = MONTH(CURDATE()) 
       AND DAY(date) = DAY(CURDATE())
       AND is_active = 1`
    );

    console.log(`Found ${birthdays.length} birthdays today`);

    // Send email to each person
    for (const birthday of birthdays) {
      await sendBirthdayEmail({
        to: birthday.email,
        name: birthday.name,
        celebrationTime: '3:00 PM',
        department: 'VIROS Team'
      });
      
      console.log(`✅ Sent birthday email to ${birthday.name}`);
    }
  } catch (error) {
    console.error('Error sending birthday emails:', error);
  }
}

// Run daily
sendTodaysBirthdays();
```

## 🎨 Customization

### Edit HTML Template

The template is located at `email-templates/birthday-wishes.html`. You can customize:

- **Colors**: Change gradient colors and theme
- **Content**: Modify the birthday message and wishes
- **Company Logo**: Replace VIROS with your company logo image
- **Footer**: Update social media links and company information

### Placeholder Variables

The following placeholders are automatically replaced:

- `[Employee Name]` - Employee's full name
- `[Time]` - Celebration time
- `[Department Name / Manager Name]` - Department or manager
- `[Company Address]` - Company address
- `[Contact Email]` - Contact email
- `[Phone Number]` - Phone number

## 📅 Schedule Automated Emails

### Using Node-Cron (Recommended)

```bash
npm install node-cron
```

Create `schedule-birthday-emails.js`:

```javascript
const cron = require('node-cron');
const { sendTodaysBirthdays } = require('./send-birthday-email');

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🎂 Checking for birthdays...');
  await sendTodaysBirthdays();
});

console.log('Birthday email scheduler started ✅');
```

### Using Windows Task Scheduler

1. Create a batch file `send-birthdays.bat`:
```batch
@echo off
cd /d "C:\Users\Abhishek Sharma\OneDrive\Desktop\viros-web-new"
node send-birthday-emails.js
```

2. Open Task Scheduler → Create Basic Task
3. Set trigger: Daily at 9:00 AM
4. Action: Start a program → Select your `.bat` file

## 🔍 Testing

### Preview Email in Browser

Simply open `email-templates/birthday-wishes.html` in your browser to preview the design.

### Send Test Email

```javascript
const { sendBirthdayEmail } = require('./send-birthday-email');

sendBirthdayEmail({
  to: 'your-email@company.com',
  name: 'Test Employee',
  celebrationTime: '3:00 PM',
  department: 'Test Department'
}).then(() => {
  console.log('Test email sent!');
}).catch(error => {
  console.error('Error:', error);
});
```

## 🎯 Integration with Dashboard

Add a "Send Birthday Email" button to your Birthday Remainder page:

```typescript
// In your page.tsx
const handleSendEmail = async (birthday: Birthday) => {
  try {
    const response = await fetch('/api/send-birthday-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: birthday.email,
        name: birthday.name,
        celebrationTime: '3:00 PM',
        department: 'Your Department'
      })
    });
    
    if (response.ok) {
      alert('Birthday email sent successfully! 🎉');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send email');
  }
};
```

## 📧 Email Service Providers

The system works with multiple email providers:

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Outlook
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

## 🛟 Troubleshooting

### Email Not Sending

1. Check `.env.local` credentials are correct
2. Verify EMAIL_USER and EMAIL_PASSWORD are set
3. For Gmail, ensure App Password is generated (not regular password)
4. Check firewall isn't blocking SMTP port 587

### Template Not Loading

1. Verify `email-templates/birthday-wishes.html` exists
2. Check file path in `send-birthday-email.js`
3. Ensure file has read permissions

## 📝 License

This email template system is part of the VIROS web application.

---

**Need Help?** Check the email configuration in `.env.local` or contact your system administrator.
