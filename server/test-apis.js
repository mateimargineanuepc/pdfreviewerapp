'use strict';

/**
 * API Testing Script
 * Tests all endpoints: registration, login, and file access
 */

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, method, url, body = null, token = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            log(`✅ ${name}: SUCCESS`, 'green');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response:`, JSON.stringify(data, null, 2));
            return { success: true, data, status: response.status };
        } else {
            log(`❌ ${name}: FAILED`, 'red');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error:`, JSON.stringify(data, null, 2));
            return { success: false, data, status: response.status };
        }
    } catch (error) {
        log(`❌ ${name}: ERROR`, 'red');
        console.log(`   Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n🧪 Starting API Tests...\n', 'blue');

    let authToken = null;
    let testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
    };

    // Test 1: Root endpoint
    log('\n📋 Test 1: Root Endpoint', 'yellow');
    await testAPI('GET /', 'GET', `${BASE_URL}/`);

    // Test 2: Register new user
    log('\n📋 Test 2: User Registration', 'yellow');
    const registerResult = await testAPI(
        'POST /api/auth/register',
        'POST',
        `${BASE_URL}/api/auth/register`,
        testUser
    );

    if (registerResult.success && registerResult.data.data?.token) {
        authToken = registerResult.data.data.token;
        log(`\n🔑 Token received: ${authToken.substring(0, 20)}...`, 'green');
    }

    // Test 3: Try to register duplicate user (should fail)
    log('\n📋 Test 3: Duplicate Registration (should fail)', 'yellow');
    await testAPI('POST /api/auth/register (duplicate)', 'POST', `${BASE_URL}/api/auth/register`, testUser);

    // Test 4: Login with correct credentials
    log('\n📋 Test 4: User Login', 'yellow');
    const loginResult = await testAPI('POST /api/auth/login', 'POST', `${BASE_URL}/api/auth/login`, testUser);

    if (loginResult.success && loginResult.data.data?.token) {
        authToken = loginResult.data.data.token;
        log(`\n🔑 Token received: ${authToken.substring(0, 20)}...`, 'green');
    }

    // Test 5: Login with wrong password (should fail)
    log('\n📋 Test 5: Login with Wrong Password (should fail)', 'yellow');
    await testAPI(
        'POST /api/auth/login (wrong password)',
        'POST',
        `${BASE_URL}/api/auth/login`,
        { email: testUser.email, password: 'wrongpassword' }
    );

    // Test 6: List PDF files (protected route)
    log('\n📋 Test 6: List PDF Files (Protected)', 'yellow');
    if (authToken) {
        await testAPI('GET /api/files', 'GET', `${BASE_URL}/api/files`, null, authToken);
    } else {
        log('   ⚠️  Skipped: No auth token available', 'yellow');
    }

    // Test 7: Get PDF URL (protected route) - without auth (should fail)
    log('\n📋 Test 7: Get PDF URL without Auth (should fail)', 'yellow');
    await testAPI('GET /api/files/test.pdf', 'GET', `${BASE_URL}/api/files/test.pdf`);

    // Test 8: Get PDF URL (protected route) - with auth
    log('\n📋 Test 8: Get PDF URL with Auth', 'yellow');
    if (authToken) {
        await testAPI('GET /api/files/test.pdf', 'GET', `${BASE_URL}/api/files/test.pdf`, null, authToken);
    } else {
        log('   ⚠️  Skipped: No auth token available', 'yellow');
    }

    log('\n✅ API Tests Completed!\n', 'blue');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.error('Error: fetch is not available. Please use Node.js 18+ or install node-fetch');
    process.exit(1);
}

// Wait for server to start
setTimeout(() => {
    runTests().catch((error) => {
        console.error('Test execution error:', error);
        process.exit(1);
    });
}, 2000);

