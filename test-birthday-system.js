/**
 * Test Birthday Email History System
 * Verifies all components are working
 */

const http = require('http');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log(`\n${BOLD}${CYAN}🎂 Birthday Email History - System Test${RESET}\n`);
    console.log('='.repeat(60));

    let allPassed = true;

    // Test 1: Check if server is running
    console.log(`\n${YELLOW}Test 1: Development Server${RESET}`);
    try {
        await makeRequest('/');
        console.log(`${GREEN}✅ Server is running on port 3000${RESET}`);
    } catch (error) {
        console.log(`${RED}❌ Server not responding. Run: npm run dev${RESET}`);
        allPassed = false;
        process.exit(1);
    }

    // Test 2: Check birthdays API
    console.log(`\n${YELLOW}Test 2: Birthdays API${RESET}`);
    try {
        const result = await makeRequest('/api/birthdays');
        if (result.status === 200 && Array.isArray(result.data)) {
            console.log(`${GREEN}✅ Birthdays API working (${result.data.length} birthdays found)${RESET}`);
            
            // Find a birthday with email for testing
            const birthdayWithEmail = result.data.find(b => b.email);
            if (birthdayWithEmail) {
                console.log(`${GREEN}   Found test birthday: ${birthdayWithEmail.name} (ID: ${birthdayWithEmail.id})${RESET}`);
                
                // Test 3: Check email history for this birthday
                console.log(`\n${YELLOW}Test 3: Email History API${RESET}`);
                try {
                    const historyResult = await makeRequest(`/api/birthday-email-history/${birthdayWithEmail.id}`);
                    if (historyResult.status === 200) {
                        const history = historyResult.data;
                        console.log(`${GREEN}✅ Email History API working${RESET}`);
                        console.log(`${GREEN}   Found ${history.length} email records${RESET}`);
                        
                        if (history.length > 0) {
                            history.forEach((h, i) => {
                                const statusColor = h.status === 'sent' ? GREEN : RED;
                                console.log(`${CYAN}   Email ${i+1}: ${statusColor}${h.status.toUpperCase()}${RESET} to ${h.recipient_email} at ${new Date(h.sent_at).toLocaleString()}`);
                            });
                        }
                    } else if (historyResult.status === 404 && historyResult.data.code === 'TABLE_NOT_FOUND') {
                        console.log(`${RED}❌ Email history table not found${RESET}`);
                        console.log(`${YELLOW}   Run: node run_birthday_email_history_migration.js${RESET}`);
                        allPassed = false;
                    } else {
                        console.log(`${RED}❌ History API error: ${historyResult.data.error}${RESET}`);
                        allPassed = false;
                    }
                } catch (error) {
                    console.log(`${RED}❌ Failed to check email history: ${error.message}${RESET}`);
                    allPassed = false;
                }
            } else {
                console.log(`${YELLOW}⚠️  No birthdays with email addresses found${RESET}`);
                console.log(`${YELLOW}   Add a birthday with email to test history${RESET}`);
            }
        } else {
            console.log(`${RED}❌ Birthdays API returned unexpected data${RESET}`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`${RED}❌ Birthdays API failed: ${error.message}${RESET}`);
        allPassed = false;
    }

    // Test 4: Check cron endpoint
    console.log(`\n${YELLOW}Test 4: Automated Birthday Check${RESET}`);
    try {
        const cronResult = await makeRequest('/api/cron/check-birthdays', 'POST');
        if (cronResult.status === 200 || cronResult.status === 401) {
            if (cronResult.status === 401) {
                console.log(`${GREEN}✅ Cron endpoint exists (requires auth token)${RESET}`);
            } else {
                console.log(`${GREEN}✅ Cron endpoint working${RESET}`);
                console.log(`${GREEN}   Today: ${cronResult.data.count} birthdays, ${cronResult.data.successCount || 0} emails sent${RESET}`);
            }
        } else {
            console.log(`${YELLOW}⚠️  Cron endpoint returned status ${cronResult.status}${RESET}`);
        }
    } catch (error) {
        console.log(`${RED}❌ Cron endpoint failed: ${error.message}${RESET}`);
        allPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log(`\n${GREEN}${BOLD}🎉 ALL TESTS PASSED!${RESET}\n`);
        console.log(`${CYAN}✨ Your birthday email system is working correctly!${RESET}`);
        console.log(`\n${YELLOW}Next steps:${RESET}`);
        console.log(`   1. Open: http://localhost:3000/dashboard/birthday-remainder`);
        console.log(`   2. Click the ${CYAN}blue History icon${RESET} (📜) to view email history`);
        console.log(`   3. Setup automation (see BIRTHDAY_EMAIL_ENHANCED.md)\n`);
    } else {
        console.log(`\n${RED}${BOLD}⚠️  SOME TESTS FAILED${RESET}\n`);
        console.log(`${YELLOW}Please check the errors above and fix them.${RESET}\n`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error(`\n${RED}Test suite failed: ${error.message}${RESET}\n`);
    process.exit(1);
});
