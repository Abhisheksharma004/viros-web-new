# 🎂 Automatic Birthday Email System - Setup Guide

## Overview
This system automatically sends birthday emails every day at 9:00 AM India time to anyone with a birthday on that day.

---

## ✅ What's Already Done

1. ✅ **Database tables** created:
   - `birthdays` - Stores birthday information
   - `birthday_email_history` - Tracks all sent emails

2. ✅ **API endpoint** ready: `/api/cron/check-birthdays`
   - Checks for today's birthdays
   - Sends emails automatically
   - Logs success/failure to database

3. ✅ **Email template** configured: `email-templates/birthday-wishes.html`
   - Professional HTML design
   - Personalized with recipient name

4. ✅ **Cron job script** created: `birthday-cron.js`
   - Runs daily at 9:00 AM
   - Handles errors gracefully
   - Provides detailed logs

5. ✅ **Environment variables** configured in `.env.local`
   - Email credentials set up
   - Cron schedule: `0 9 * * *` (9:00 AM daily)
   - Timezone: `Asia/Kolkata` (India time)

---

## 🚀 How to Start Auto Email System

### Option 1: Simple Mode (Terminal must stay open)

```powershell
# Start the birthday checker
npm run cron:birthday
```

**What you'll see:**
```
🎂 Birthday Checker Started
⏰ Schedule: 0 9 * * *
🌐 Endpoint: http://localhost:3000/api/cron/check-birthdays
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Birthday checker is now running!
Press Ctrl+C to stop
```

**Important:** Keep this terminal window open. The script will automatically check birthdays at 9:00 AM every day.

---

### Option 2: Production Mode (Runs in background - PM2)

PM2 is a process manager that keeps the script running even after you close the terminal or restart the server.

#### Install PM2 globally:
```powershell
npm install -g pm2
```

#### Start the birthday checker:
```powershell
pm2 start birthday-cron.js --name "birthday-checker"
```

#### Save the configuration:
```powershell
pm2 save
pm2 startup
```

#### Useful PM2 commands:
```powershell
# Check status
pm2 status

# View logs
pm2 logs birthday-checker

# Stop the checker
pm2 stop birthday-checker

# Restart the checker
pm2 restart birthday-checker

# Delete the process
pm2 delete birthday-checker
```

---

## 🧪 Testing the System

### Test Birthday Check (Without sending emails):
```powershell
curl http://localhost:3000/api/cron/check-birthdays
```

### Manual Test Email:
1. Go to: http://localhost:3000/dashboard/birthday-remainder
2. Find someone with today's birthday
3. Click the email icon (✉️) to manually send

---

## ⚙️ Configuration

### Change the Schedule Time
Edit `.env.local`:
```env
# Current: 9:00 AM daily
BIRTHDAY_CHECK_SCHEDULE=0 9 * * *

# Examples:
# Every day at 8:00 AM: 0 8 * * *
# Every day at 6:00 PM: 0 18 * * *
# Every Monday at 9:00 AM: 0 9 * * 1
# Every hour: 0 * * * *
```

### Change Timezone
Edit `.env.local`:
```env
# India Standard Time
TZ=Asia/Kolkata

# Other timezones:
# US Eastern: America/New_York
# US Pacific: America/Los_Angeles
# UK: Europe/London
# Australia: Australia/Sydney
```

---

## 📊 How It Works

1. **Daily Check**: At 9:00 AM, the cron job runs
2. **Database Query**: Finds all birthdays matching today's date (MM-DD)
3. **Filter Active**: Only sends to people with:
   - `is_active = true`
   - Valid email address
4. **Send Emails**: Sends personalized birthday wishes
5. **Log History**: Records each email in `birthday_email_history` table
6. **Error Handling**: If an email fails, logs the error and continues

---

## 📧 Email Example

**Subject:** 🎉 Happy Birthday [Name]! 🎂

**Body:** Professional HTML email with:
- Company logo
- Personalized greeting
- Celebration message
- Company signature

---

## 🔧 Troubleshooting

### Problem: Emails not sending

**Check these:**
1. Is Next.js dev server running? (`npm run dev`)
2. Is the cron job running? (`pm2 status` or check terminal)
3. Are email credentials correct in `.env.local`?
4. Is the birthday marked as "Active" in dashboard?
5. Does the person have a valid email address?

### Check logs:
```powershell
# If using PM2
pm2 logs birthday-checker

# Or check the terminal where npm run cron:birthday is running
```

### Test email manually:
Go to Dashboard → Birthday Remainder → Click ✉️ icon

---

## 🎯 Quick Start Checklist

- [ ] Next.js server is running (`npm run dev`)
- [ ] Database tables created (birthdays, birthday_email_history)
- [ ] Email credentials configured in `.env.local`
- [ ] At least one birthday added with email
- [ ] Cron job started (`npm run cron:birthday` OR `pm2 start birthday-cron.js`)
- [ ] Tested manually by clicking email icon in dashboard

---

## 📝 Important Notes

1. **Server Must Be Running**: The Next.js dev server (`npm run dev`) must be running for the cron job to send API requests.

2. **Two Processes**: Run both:
   - Terminal 1: `npm run dev` (Next.js server)
   - Terminal 2: `npm run cron:birthday` (Birthday checker)

3. **Production**: For VPS deployment, use PM2 to keep both running 24/7.

4. **Email Limits**: Gmail has daily sending limits (~500 emails/day for regular accounts).

---

## 🎉 Success!

Once set up, the system will automatically:
- ✅ Check for birthdays every day at 9:00 AM
- ✅ Send personalized emails
- ✅ Log all activity
- ✅ Handle errors gracefully
- ✅ Continue working even if one email fails

**No manual intervention needed!**

---

## 💡 Tips

- Add birthdays in advance for employees/clients
- Check the "Today" filter in dashboard to see who has birthdays
- Review email history for each person
- Update email template in `email-templates/birthday-wishes.html` to customize message

---

For questions or issues, check the logs or test manually through the dashboard.
