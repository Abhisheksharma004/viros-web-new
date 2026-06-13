/**
 * Test script for Forgot Password with OTP functionality
 * Tests the complete flow: Request OTP -> Verify OTP -> Reset Password
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@viros.com'; // Use a valid email from your users table
const NEW_PASSWORD = 'NewSecure123!';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

async function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRequestOTP() {
    log('\n📧 TEST 1: Request OTP', 'cyan');
    log('=' .repeat(50), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/api/forgot-password/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });

        const data = await response.json();

        if (response.ok) {
            log('✅ OTP request successful', 'green');
            log(`   Message: ${data.message}`, 'green');
            log(`   Email: ${data.email}`, 'green');
            return true;
        } else {
            log(`❌ OTP request failed: ${data.message}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function testVerifyOTP(otp) {
    log('\n🔍 TEST 2: Verify OTP', 'cyan');
    log('=' .repeat(50), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/api/forgot-password/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, otp }),
        });

        const data = await response.json();

        if (response.ok) {
            log('✅ OTP verification successful', 'green');
            log(`   Message: ${data.message}`, 'green');
            return true;
        } else {
            log(`❌ OTP verification failed: ${data.message}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function testResetPassword(otp) {
    log('\n🔐 TEST 3: Reset Password', 'cyan');
    log('=' .repeat(50), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/api/forgot-password/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: TEST_EMAIL, 
                otp,
                newPassword: NEW_PASSWORD 
            }),
        });

        const data = await response.json();

        if (response.ok) {
            log('✅ Password reset successful', 'green');
            log(`   Message: ${data.message}`, 'green');
            return true;
        } else {
            log(`❌ Password reset failed: ${data.message}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function testInvalidOTP() {
    log('\n🛡️  TEST 4: Invalid OTP Handling', 'cyan');
    log('=' .repeat(50), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/api/forgot-password/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, otp: '0000000' }),
        });

        const data = await response.json();

        if (!response.ok) {
            log('✅ Invalid OTP correctly rejected', 'green');
            log(`   Message: ${data.message}`, 'green');
            return true;
        } else {
            log('❌ Invalid OTP was accepted (security issue!)', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function testNonExistentEmail() {
    log('\n🔒 TEST 5: Non-existent Email', 'cyan');
    log('=' .repeat(50), 'cyan');

    try {
        const response = await fetch(`${BASE_URL}/api/forgot-password/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent@example.com' }),
        });

        const data = await response.json();

        // Should still return success to prevent email enumeration
        if (response.ok) {
            log('✅ Non-existent email handled securely', 'green');
            log('   (Returns success to prevent enumeration)', 'green');
            return true;
        } else {
            log('⚠️  Unexpected response for non-existent email', 'yellow');
            return false;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function runTests() {
    log('\n╔════════════════════════════════════════════════╗', 'blue');
    log('║   FORGOT PASSWORD OTP SYSTEM TEST SUITE      ║', 'blue');
    log('╚════════════════════════════════════════════════╝', 'blue');

    log(`\n📝 Test Configuration:`, 'yellow');
    log(`   Base URL: ${BASE_URL}`, 'yellow');
    log(`   Test Email: ${TEST_EMAIL}`, 'yellow');
    log(`   New Password: ${NEW_PASSWORD}`, 'yellow');

    // Check if server is running
    log('\n🔍 Checking server availability...', 'cyan');
    try {
        await fetch(BASE_URL);
        log('✅ Server is running', 'green');
    } catch (error) {
        log('❌ Server is not running. Please start it with: npm run dev', 'red');
        process.exit(1);
    }

    const results = {
        passed: 0,
        failed: 0,
    };

    // Test 1: Request OTP
    const requestResult = await testRequestOTP();
    requestResult ? results.passed++ : results.failed++;

    // Wait for email to be sent
    log('\n⏳ Waiting for email to be sent...', 'yellow');
    log('   Please check your email and enter the OTP when ready.', 'yellow');
    
    // In a real automated test, you'd fetch the OTP from the database
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const otp = await new Promise((resolve) => {
        rl.question('\n📮 Enter the 7-digit OTP from your email: ', (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });

    // Test 2: Verify OTP
    const verifyResult = await testVerifyOTP(otp);
    verifyResult ? results.passed++ : results.failed++;

    // Test 3: Reset Password
    const resetResult = await testResetPassword(otp);
    resetResult ? results.passed++ : results.failed++;

    // Test 4: Invalid OTP
    const invalidResult = await testInvalidOTP();
    invalidResult ? results.passed++ : results.failed++;

    // Test 5: Non-existent Email
    const nonExistentResult = await testNonExistentEmail();
    nonExistentResult ? results.passed++ : results.failed++;

    // Summary
    log('\n╔════════════════════════════════════════════════╗', 'blue');
    log('║              TEST SUMMARY                      ║', 'blue');
    log('╚════════════════════════════════════════════════╝', 'blue');
    log(`\n✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`📊 Total: ${results.passed + results.failed}\n`, 'cyan');

    if (results.failed === 0) {
        log('🎉 All tests passed! Forgot password system is working correctly.', 'green');
    } else {
        log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
    }

    log('\n💡 Next steps:', 'cyan');
    log('   1. Test the frontend at: http://localhost:3000/forgot-password', 'cyan');
    log('   2. Verify email delivery and formatting', 'cyan');
    log('   3. Test with different email providers', 'cyan');
}

// Run tests
runTests().catch((error) => {
    console.error('Test suite crashed:', error);
    process.exit(1);
});
