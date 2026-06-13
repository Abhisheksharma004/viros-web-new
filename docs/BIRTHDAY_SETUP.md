# Birthday Reminder - Database Setup Fix

## Issue
You're seeing an error: "Failed to fetch birthdays. Please check your database connection."

This is caused by a MySQL tablespace corruption issue.

## Quick Fix (Recommended)

### Option 1: Using phpMyAdmin (Easiest)

1. Open phpMyAdmin (usually at http://localhost/phpmyadmin)
2. Select your database `viros_web_new` from the left sidebar
3. Click on the **SQL** tab at the top
4. Copy and paste this entire SQL code:

```sql
-- Drop the table if it exists (with tablespace cleanup)
DROP TABLE IF EXISTS birthdays;

-- Create the birthdays table
CREATE TABLE birthdays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create indexes for better performance
CREATE INDEX idx_birthdays_date ON birthdays(date);
CREATE INDEX idx_birthdays_active ON birthdays(is_active);
```

5. Click **Go** button
6. Refresh your Birthday Reminder page

### Option 2: Using MySQL Command Line

If you have MySQL command line access:

```bash
mysql -u root -p viros_web_new
```

Then paste the same SQL commands from Option 1.

### Option 3: Manual File Cleanup (Advanced)

If the above doesn't work, you may need to manually delete the orphaned tablespace files:

1. **Stop your MySQL server** (Stop XAMPP/WAMP/MySQL service)
2. Navigate to your MySQL data directory:
   - XAMPP: `C:\xampp\mysql\data\viros_web_new\`
   - WAMP: `C:\wamp64\bin\mysql\mysql[version]\data\viros_web_new\`
3. **Delete** these files if they exist:
   - `birthdays.ibd`
   - `birthdays.frm` (older MySQL versions)
4. **Start your MySQL server** again
5. Run the SQL from Option 1

## Verification

After running the SQL, verify the table was created:

```bash
node test_db_connection.js
```

You should see:
- ✅ Connected to database successfully!
- ✅ Birthdays table exists!
- ✅ Table has 0 records

## Still Having Issues?

If none of the above works:

1. Make sure MySQL server is running
2. Check that database `viros_web_new` exists
3. Verify your `.env.local` file has correct database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=viros_web_new
   DB_PORT=3306
   ```

## Need Help?

Run this diagnostic script:
```bash
node test_db_connection.js
```

This will show you exactly what the problem is.
