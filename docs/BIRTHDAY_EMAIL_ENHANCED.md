# Birthday Email System - Enhanced Features

## 🎉 New Features Implemented

### 1. **Email Validation** ✅
- Validates email format before sending
- Prevents invalid email addresses
- Located in `src/lib/email-utils.ts`

### 2. **Email History Tracking** 📝
- Tracks all sent emails with status
- Records success/failure with error messages
- View history per birthday entry
- Database table: `birthday_email_history`

### 3. **Email Preview** 👁️
- Preview birthday emails before sending
- Opens in new window
- See exactly what recipients will receive

### 4. **Automated Birthday Check** ⏰
- API endpoint to check today's birthdays
- Automatically sends emails
- Can be triggered by cron jobs
- Endpoint: `/api/cron/check-birthdays`

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Create the email history table:

```bash
node run_birthday_email_history_migration.js
```

This creates the `birthday_email_history` table to track sent emails.

---

### Step 2: Configure Environment Variables

Make sure these are set in your `.env.local`:

```env
# Email Configuration (required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
COMPANY_NAME=VIROS

# Database Configuration (required)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=viros_web_new
DB_PORT=3306

# Cron Security (optional but recommended for production)
CRON_SECRET=your-random-secret-key-here
```

---

## 📱 Dashboard Features

### Preview Email Button 👁️
- **Purple eye icon** next to send button
- Opens preview in new window
- Shows exactly what recipient sees
- No email sent during preview

### Send Email Button 📧
- **Green mail icon**
- Sends birthday wishes
- Tracks sending in history
- Validates email before sending

### View History Button 📜
- **Blue history icon**
- Shows all emails sent to that person
- Displays status (sent/failed)
- Shows timestamps and error messages

---

## ⏰ Automated Birthday Emails

### Option 1: Vercel Cron Jobs (Recommended if deployed on Vercel)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-birthdays",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC.

### Option 2: Server Cron Job (For VPS/Linux)

Edit crontab:
```bash
crontab -e
```

Add this line (runs daily at 9 AM):
```
0 9 * * * curl -X POST https://yourdomain.com/api/cron/check-birthdays -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 9:00 AM
4. Action: Start a program
5. Program: `curl`
6. Arguments: `-X POST http://localhost:3000/api/cron/check-birthdays -H "Authorization: Bearer YOUR_CRON_SECRET"`

### Option 4: Node Cron (Add to your app)

Install:
```bash
npm install node-cron
```

Create `cron/birthday-check.js`:
```javascript
const cron = require('node-cron');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Checking birthdays...');
    try {
        const response = await fetch('http://localhost:3000/api/cron/check-birthdays', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });
        const result = await response.json();
        console.log('Birthday check result:', result);
    } catch (error) {
        console.error('Birthday check failed:', error);
    }
});
```

---

## 🔒 Security

### Protect Cron Endpoint

Set `CRON_SECRET` in `.env.local`:
```env
CRON_SECRET=generate-a-random-secure-key-here
```

When calling the cron endpoint, include:
```
Authorization: Bearer YOUR_CRON_SECRET
```

---

## 📊 API Endpoints

### Check Today's Birthdays (GET)
```
GET /api/cron/check-birthdays
```
Returns list of birthdays without sending emails.

### Send Birthday Emails (POST)
```
POST /api/cron/check-birthdays
```
Checks and automatically sends emails to today's birthdays.

### Preview Email (POST)
```
POST /api/preview-birthday-email
Body: { name: "John Doe", celebrationTime: "3:00 PM", department: "VIROS Team" }
```
Returns HTML preview.

### Send Single Email (POST)
```
POST /api/send-birthday-email
Body: {
  to: "email@example.com",
  name: "John Doe",
  celebrationTime: "3:00 PM",
  department: "VIROS Team",
  birthdayId: 1
}
```

### Get Email History (GET)
```
GET /api/birthday-email-history/[id]
```
Returns email history for specific birthday ID.

---

## 🧪 Testing

### Test Email Sending
1. Add a test birthday with your email
2. Set date to today
3. Click **Preview** button to see email
4. Click **Send** button to test delivery
5. Click **History** button to verify tracking

### Test Automated Check
```bash
curl -X POST http://localhost:3000/api/cron/check-birthdays \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test GET Endpoint
```bash
curl http://localhost:3000/api/cron/check-birthdays \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📈 Email History Table Structure

```sql
birthday_email_history
├── id (Primary Key)
├── birthday_id (Foreign Key → birthdays.id)
├── recipient_email
├── recipient_name
├── sent_at (Timestamp)
├── status (sent/failed/pending)
├── message_id
├── error_message
├── celebration_time
└── department
```

---

## 🐛 Troubleshooting

### "Email history table not found"
**Solution:** Run the migration:
```bash
node run_birthday_email_history_migration.js
```

### Preview button doesn't work
**Problem:** Pop-up blocked by browser
**Solution:** Allow pop-ups for your domain in browser settings

### Emails not sending automatically
1. Verify cron job is running
2. Check `CRON_SECRET` matches in both places
3. Check server logs for errors
4. Test manually: `curl -X POST http://localhost:3000/api/cron/check-birthdays`

### Invalid email format error
**Cause:** Email validation is now active
**Solution:** Ensure email addresses are properly formatted (e.g., user@domain.com)

---

## 💡 Tips

1. **Test Locally First**: Use manual send before setting up cron
2. **Set Cron Time Wisely**: Send emails when recipients are most likely to check
3. **Monitor History**: Regular check history to catch delivery issues
4. **Keep Emails Updated**: Verify email addresses are current
5. **Use Preview**: Always preview before bulk sends

---

## 📞 Support

If you encounter issues:
1. Check console logs in browser (F12)
2. Check server logs in terminal
3. Verify all environment variables are set
4. Test database connection
5. Ensure migration was run successfully

---

## 🎯 Future Enhancements (Optional)

- [ ] Email templates selector
- [ ] Scheduled send (choose time per person)
- [ ] SMS integration
- [ ] Email analytics dashboard
- [ ] Bulk email actions
- [ ] Email queue system
- [ ] Retry failed emails
- [ ] Custom message per person

---

**Congratulations!** 🎊 Your birthday email system is now fully automated with tracking, validation, and preview capabilities!
