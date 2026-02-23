/**
 * Node-Cron Birthday Checker
 * 
 * This script runs in the background and automatically checks for birthdays
 * and sends emails at the scheduled time.
 * 
 * Installation:
 * npm install node-cron
 * 
 * Usage:
 * node birthday-cron.js
 * 
 * For production, use PM2:
 * npm install -g pm2
 * pm2 start birthday-cron.js --name "birthday-checker"
 * pm2 save
 * pm2 startup
 */

const cron = require('node-cron');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// Configuration
const config = {
    host: process.env.APP_HOST || 'localhost',
    port: process.env.APP_PORT || '3000',
    protocol: process.env.APP_PROTOCOL || 'http',
    cronSecret: process.env.CRON_SECRET || '',
    // Cron schedule: "0 9 * * *" = Every day at 9:00 AM
    // Format: second minute hour day month weekday
    schedule: process.env.BIRTHDAY_CHECK_SCHEDULE || '0 9 * * *'
};

/**
 * Make HTTP request to check birthdays
 */
async function checkBirthdays() {
    return new Promise((resolve, reject) => {
        const url = `${config.protocol}://${config.host}:${config.port}/api/cron/check-birthdays`;
        const clientLib = config.protocol === 'https' ? https : http;
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        };

        // Add authorization if secret is configured
        if (config.cronSecret) {
            options.headers['Authorization'] = `Bearer ${config.cronSecret}`;
        }

        console.log(`🔗 Connecting to: ${url}`);
        if (config.cronSecret) {
            console.log('🔐 Using authorization token');
        }

        const req = clientLib.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                // Log response status and body for debugging
                console.log(`📡 Response Status: ${res.statusCode}`);
                
                if (res.statusCode !== 200) {
                    console.error(`❌ HTTP Error ${res.statusCode}:`);
                    console.error(data.substring(0, 500)); // Log first 500 chars
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    console.error('❌ Invalid JSON response:');
                    console.error(data.substring(0, 500)); // Log first 500 chars
                    reject(new Error(`Failed to parse response: ${data.substring(0, 100)}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout after 30 seconds'));
        });

        req.end();
    });
}

/**
 * Main cron job
 */
console.log('🎂 Birthday Checker Started');
console.log(`⏰ Schedule: ${config.schedule}`);
console.log(`🌐 Endpoint: ${config.protocol}://${config.host}:${config.port}/api/cron/check-birthdays`);
console.log('━'.repeat(50));

// Schedule the job
const task = cron.schedule(config.schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running birthday check...`);
    
    try {
        const result = await checkBirthdays();
        
        if (result.success) {
            console.log(`✅ Success: ${result.message}`);
            console.log(`📊 Total: ${result.count} | Sent: ${result.successCount} | Failed: ${result.failCount}`);
            
            if (result.results && result.results.length > 0) {
                console.log('\n📧 Details:');
                result.results.forEach((r, index) => {
                    const status = r.success ? '✅' : '❌';
                    console.log(`  ${index + 1}. ${status} ${r.name} (${r.email})`);
                    if (!r.success && r.error) {
                        console.log(`     Error: ${r.error}`);
                    }
                });
            }
        } else {
            console.error('❌ Failed:', result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Error checking birthdays:', error.message);
    }
    
    console.log('━'.repeat(50));
}, {
    scheduled: true,
    timezone: process.env.TZ || "America/New_York" // Change to your timezone
});

// Start the cron job
task.start();

console.log('\n✨ Birthday checker is now running!');
console.log('Press Ctrl+C to stop\n');

// Test run on startup (optional - uncomment if you want)
setTimeout(async () => {
    console.log('🧪 Running test check...\n');
    try {
        const result = await checkBirthdays();
        console.log('Test result:', result);
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping birthday checker...');
    task.stop();
    console.log('✅ Stopped gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Stopping birthday checker...');
    task.stop();
    console.log('✅ Stopped gracefully');
    process.exit(0);
});
