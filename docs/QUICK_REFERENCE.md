# 🎂 Birthday Email System - Quick Reference

## 🚀 One-Line Setup
```bash
npm run setup:birthday
```

## 📦 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run setup:birthday` | Complete system setup (tables + history) |
| `npm run migrate:birthday` | Create birthdays table only |
| `npm run migrate:birthday-history` | Create email history table only |
| `npm run cron:birthday` | Start automated birthday checker |

## 🎯 Dashboard Features

### Birthday List Actions

| Icon | Color | Action | Description |
|------|-------|--------|-------------|
| 👁️ | Purple | Preview | See email before sending |
| 📧 | Green | Send | Send birthday email now |
| 📜 | Blue | History | View all sent emails |
| ✏️ | Cyan | Edit | Modify birthday details |
| 🗑️ | Red | Delete | Remove birthday |

## 📡 API Endpoints

### Send Email
```bash
POST /api/send-birthday-email
Content-Type: application/json

{
  "to": "email@example.com",
  "name": "John Doe",
  "birthdayId": 1
}
```

### Preview Email
```bash
POST /api/preview-birthday-email
Content-Type: application/json

{
  "name": "John Doe",
  "celebrationTime": "3:00 PM",
  "department": "VIROS Team"
}
```

### Check Today's Birthdays (Read Only)
```bash
GET /api/cron/check-birthdays
Authorization: Bearer YOUR_CRON_SECRET
```

### Send Today's Birthday Emails
```bash
POST /api/cron/check-birthdays
Authorization: Bearer YOUR_CRON_SECRET
```

### Get Email History
```bash
GET /api/birthday-email-history/[birthdayId]
```

## ⚙️ Environment Variables

### Required
```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=viros_web_new
DB_PORT=3306
```

### Optional
```env
# Company
COMPANY_NAME=VIROS

# Security
CRON_SECRET=random-secret-key

# Cron Schedule
BIRTHDAY_CHECK_SCHEDULE=0 9 * * *

# App Config (for cron script)
APP_HOST=localhost
APP_PORT=3000
APP_PROTOCOL=http
```

## 🕐 Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, Sun=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Schedules
- `0 9 * * *` - Every day at 9:00 AM
- `0 12 * * *` - Every day at 12:00 PM
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `*/30 * * * *` - Every 30 minutes
- `0 */6 * * *` - Every 6 hours

## 🐛 Troubleshooting

### Table Not Found
```bash
npm run setup:birthday
```

### Preview Blocked
Allow pop-ups in browser settings for your domain

### Cron Not Working
```bash
# Test manually
curl -X POST http://localhost:3000/api/cron/check-birthdays \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Invalid Email
Check email format: `user@domain.com`

## 📁 File Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── send-birthday-email/route.ts
│   │   │   ├── preview-birthday-email/route.ts
│   │   │   ├── cron/check-birthdays/route.ts
│   │   │   └── birthday-email-history/[id]/route.ts
│   │   └── dashboard/
│   │       └── birthday-remainder/page.tsx
│   └── lib/
│       └── email-utils.ts
├── migrations/
│   └── create_birthday_email_history_table.sql
├── email-templates/
│   └── birthday-wishes.html
├── setup-birthday-system.js
├── birthday-cron.js
└── vercel.json
```

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Sent | Green | Successfully delivered |
| 🔴 Failed | Red | Delivery failed |
| 🟡 Pending | Yellow | Queued/Processing |

## 💾 Database Tables

### `birthdays`
- id, name, date, phone, email, notes
- is_active, created_at, updated_at

### `birthday_email_history`
- id, birthday_id, recipient_email, recipient_name
- sent_at, status, message_id, error_message
- celebration_time, department

## 🔑 Key Features

✅ Email validation (RFC 5322)  
✅ Email history tracking  
✅ Preview before send  
✅ Automated daily checks  
✅ Error logging  
✅ Bulk sending with rate limiting  
✅ Bearer token security  
✅ Beautiful UI  

## 📞 Quick Actions

### Test Email
1. Add birthday with your email
2. Set date to today
3. Click preview (purple eye)
4. Click send (green mail)
5. Check history (blue)

### Setup Automation
**Vercel**: Already configured  
**Node**: `npm install node-cron && npm run cron:birthday`  
**Linux**: Add to crontab  
**Windows**: Use Task Scheduler  

## 🎓 Email Validation Examples

✅ **Valid**
- user@example.com
- name.surname@company.co.uk
- test+tag@mail.org

❌ **Invalid**
- @example.com
- user@
- user @example.com
- user..name@example.com

---

**Need help?** Check `BIRTHDAY_EMAIL_ENHANCED.md` for detailed guide!
