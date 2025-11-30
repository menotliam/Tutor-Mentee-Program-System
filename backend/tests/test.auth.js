/**
 * TEST SCRIPT - Kiểm tra hệ thống auth
 * 
 * Script này sẽ test login cho 3 tài khoản:
 * - admin@test.com
 * - instructor@test.com
 * - student@test.com
 * 
 * Chạy: node src/tests/testAuth.js
 */

const API_BASE = 'http://localhost:5000/api';

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const testAccounts = [
  { email: 'admin@test.com', password: '123456', expectedRole: 'admin' },
  { email: 'instructor@test.com', password: '123456', expectedRole: 'instructor' },
  { email: 'student@test.com', password: '123456', expectedRole: 'student' },
];

async function testLogin(email, password, expectedRole) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (data.user.role === expectedRole) {
        console.log(`${colors.green}✅ SUCCESS${colors.reset} - ${email}`);
        console.log(`   Role: ${colors.cyan}${data.user.role}${colors.reset}`);
        console.log(`   User: ${data.user.fullName}`);
        console.log(`   Token: ${data.token.substring(0, 30)}...`);
        return { success: true, data };
      } else {
        console.log(`${colors.yellow}⚠️  WARNING${colors.reset} - Role mismatch for ${email}`);
        console.log(`   Expected: ${expectedRole}, Got: ${data.user.role}`);
        return { success: false };
      }
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset} - ${email}`);
      console.log(`   Message: ${data.message}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${email}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   ${colors.yellow}⚠️  Make sure server is running!${colors.reset}`);
    return { success: false };
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}🧪 TESTING AUTH SYSTEM - 3 ROLES${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  let successCount = 0;

  for (const account of testAccounts) {
    const result = await testLogin(account.email, account.password, account.expectedRole);
    if (result.success) successCount++;
    console.log(''); // Empty line
  }

  console.log('='.repeat(60));
  console.log(`${colors.cyan}📊 RESULTS: ${successCount}/${testAccounts.length} passed${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  if (successCount === testAccounts.length) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Check the logs above.${colors.reset}\n`);
  }
}

// Run tests
runTests();
