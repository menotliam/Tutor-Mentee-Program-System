# 🧪 TESTING STRATEGY

## BK Tutor - Tutor Management System

| **Document Information** | |
|--------------------------|--|
| **Document Version** | 1.0 |
| **Created Date** | November 27, 2025 |
| **Author** | QC Team |

---

## 📋 Overview

This document defines the testing approach for BK Tutor system, including **Manual Testing** and **Automation Testing** strategies.

---

## 1. Testing Approach

### 1.1 Hybrid Testing Strategy

We recommend a **hybrid approach** that combines:

| Phase | Approach | Rationale |
|-------|----------|-----------|
| **Phase 1: Initial Testing** | 🖐️ **Manual Testing** | - Quick feedback<br>- Exploratory testing<br>- UI/UX validation |
| **Phase 2: Regression** | 🤖 **Automation Testing** | - Repeatable tests<br>- Fast execution<br>- CI/CD integration |
| **Phase 3: Ongoing** | **Both** | - Manual for new features<br>- Automation for regression |

---

## 2. Manual Testing Guide

### 2.1 When to Use Manual Testing

✅ **Use Manual Testing for:**
- New features (first-time testing)
- UI/UX validation
- Exploratory testing
- Edge cases discovery
- Complex user workflows
- Initial smoke testing

### 2.2 Manual Testing Process

#### Step 1: Test Case Execution
1. Open `TEST_CASES.md` or `TEST_CASES_TRACKER.csv`
2. Follow test steps exactly as written
3. Record results in CSV tracker:
   - Status: Pass / Fail / Blocked
   - Actual Result
   - Defect ID (if failed)
   - Screenshots/videos (if needed)

#### Step 2: Test Data Preparation
Use test data from **Appendix B** in `TEST_CASES.md`:
- Pre-created users (Admin, Student, Tutor)
- Pre-created classes
- Test scenarios setup

#### Step 3: Bug Reporting
If test fails:
1. Record in CSV tracker
2. Create defect ticket (Jira/GitHub Issues)
3. Link defect ID back to test case
4. Attach screenshots/logs

---

## 3. Automation Testing Guide

### 3.1 When to Use Automation Testing

✅ **Use Automation Testing for:**
- **Regression testing** (repeated execution)
- **API testing** (backend endpoints)
- **Smoke testing** (quick validation)
- **Performance testing** (load/stress tests)
- **Critical paths** (Login, Booking)

### 3.2 Test Cases Suitable for Automation

| Priority | Module | Test Cases | Automation Type |
|----------|--------|------------|-----------------|
| **HIGH** | Authentication | TC-AUTH-001, 002, 003, 006, 007, 020 | API + E2E |
| **HIGH** | Booking | TC-BOOK-001, 002, 008, 009 | API + E2E |
| **MEDIUM** | Profile | TC-PROF-003 | API |
| **HIGH** | Performance | TC-PERF-001, 002, 003 | Load Testing |

---

## 4. Automation Testing Setup

### 4.1 Recommended Tools

#### Option A: API Testing (Recommended for Backend)
| Tool | Use Case | Setup Complexity |
|------|----------|------------------|
| **Postman** | Manual + Automated API tests | ⭐ Easy |
| **Newman** (Postman CLI) | CI/CD integration | ⭐⭐ Medium |
| **Jest + Supertest** | Unit + Integration tests | ⭐⭐⭐ Hard |
| **Mocha + Chai** | Backend API tests | ⭐⭐⭐ Hard |

#### Option B: E2E Testing (Full User Flow)
| Tool | Use Case | Setup Complexity |
|------|----------|------------------|
| **Playwright** | E2E testing (Modern) | ⭐⭐ Medium |
| **Cypress** | E2E testing (Popular) | ⭐⭐ Medium |
| **Selenium** | E2E testing (Legacy) | ⭐⭐⭐ Hard |

#### Option C: Load/Performance Testing
| Tool | Use Case |
|------|----------|
| **Apache JMeter** | Load/Stress testing |
| **k6** | Modern load testing |
| **Artillery** | Load testing (Node.js) |

---

### 4.2 Automation Test Structure (Example)

```
backend/
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # API integration tests
│   │   ├── auth.test.js
│   │   ├── booking.test.js
│   │   └── profile.test.js
│   └── e2e/              # End-to-end tests
│
frontend/
├── tests/
│   ├── e2e/              # E2E tests (Playwright/Cypress)
│   │   ├── login.spec.js
│   │   ├── booking.spec.js
│   │   └── calendar.spec.js
```

---

## 5. Test Case Mapping: Manual vs Automation

### 5.1 Authentication Module

| TC-ID | Title | Manual | Automation | Notes |
|-------|-------|--------|------------|-------|
| TC-AUTH-001 | Successful login | ✅ Yes | ✅ API | First manual, then automate |
| TC-AUTH-002 | Login with invalid email | ✅ Yes | ✅ API | Easy to automate |
| TC-AUTH-003 | Login with invalid password | ✅ Yes | ✅ API | Easy to automate |
| TC-AUTH-006 | Account locked | ✅ Yes | ✅ API | Important to automate |
| TC-AUTH-007 | Inactive account | ✅ Yes | ✅ API | Easy to automate |
| TC-AUTH-010 | Logout | ✅ Yes | ✅ API | Easy to automate |
| TC-AUTH-011 | Session persistence | ✅ Yes | ✅ E2E | Browser-specific, manual first |
| TC-AUTH-020 | Protected route | ✅ Yes | ✅ API | Critical security test |

**Automation Priority:** 🔴 HIGH - These are critical and repetitive

---

### 5.2 Booking Module

| TC-ID | Title | Manual | Automation | Notes |
|-------|-------|--------|------------|-------|
| TC-BOOK-001 | Book class successfully | ✅ Yes | ✅ API + E2E | Critical path |
| TC-BOOK-002 | Book full class | ✅ Yes | ✅ API | Easy to automate |
| TC-BOOK-003 | Book past class | ✅ Yes | ✅ API | Easy to automate |
| TC-BOOK-008 | Cancel >3 hours | ✅ Yes | ✅ API | Business rule - automate |
| TC-BOOK-009 | Cancel <3 hours | ✅ Yes | ✅ API | Business rule - automate |
| TC-BOOK-013 | Change booking | ✅ Yes | ✅ API | Complex flow |

**Automation Priority:** 🔴 HIGH - Core business logic

---

### 5.3 UI/UX Module

| TC-ID | Title | Manual | Automation | Notes |
|-------|-------|--------|------------|-------|
| TC-UI-001 | Login page display | ✅ Yes | ✅ E2E | Visual validation |
| TC-UI-003 | Calendar display | ✅ Yes | ⚠️ Partial | Manual for visual, E2E for data |
| TC-UI-004 | Error messages | ✅ Yes | ✅ E2E | Can automate text check |
| TC-UI-005 | Loading states | ✅ Yes | ✅ E2E | Can automate |

**Automation Priority:** 🟡 MEDIUM - Visual tests need manual review

---

### 5.4 Performance Module

| TC-ID | Title | Manual | Automation | Notes |
|-------|-------|--------|------------|-------|
| TC-PERF-001 | Login response time | ❌ No | ✅ Load Test | Must automate |
| TC-PERF-002 | Booking response time | ❌ No | ✅ Load Test | Must automate |
| TC-PERF-003 | DB connection pool | ❌ No | ✅ Load Test | Must automate |

**Automation Priority:** 🔴 HIGH - Cannot test manually

---

## 6. Recommended Testing Workflow

### Phase 1: Initial Manual Testing (Weeks 1-2)

```
┌─────────────────────────────────────┐
│ 1. Manual Smoke Test                │
│    - Login, Logout                  │
│    - Book a class                   │
│    - Cancel booking                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. Manual Full Test Execution       │
│    - All HIGH priority tests        │
│    - Record in CSV tracker          │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. Bug Fix & Retest                 │
│    - Fix critical bugs              │
│    - Verify fixes manually          │
└─────────────────────────────────────┘
```

### Phase 2: Automation Setup (Weeks 2-3)

```
┌─────────────────────────────────────┐
│ 1. Setup Test Framework             │
│    - Install Jest/Mocha             │
│    - Configure test environment     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. Automate Critical Tests          │
│    - Login API tests                │
│    - Booking API tests              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. Integrate CI/CD                  │
│    - Run on every commit            │
│    - Generate test reports          │
└─────────────────────────────────────┘
```

### Phase 3: Continuous Testing (Ongoing)

```
┌─────────────────────────────────────┐
│ Manual Testing                      │
│ - New features                      │
│ - Exploratory                       │
└─────────────────────────────────────┘
         +
┌─────────────────────────────────────┐
│ Automation Testing                  │
│ - Regression                        │
│ - Smoke tests                       │
│ - Performance                       │
└─────────────────────────────────────┘
```

---

## 7. Test Execution Checklist

### 7.1 Before Starting Tests

- [ ] Test environment set up
- [ ] Test data prepared (users, classes)
- [ ] Test cases reviewed
- [ ] Testing tools ready (Postman, browser, etc.)
- [ ] Defect tracking system ready

### 7.2 During Testing

- [ ] Execute test cases step-by-step
- [ ] Record actual results accurately
- [ ] Take screenshots for failures
- [ ] Report defects immediately
- [ ] Update CSV tracker in real-time

### 7.3 After Testing

- [ ] All results documented
- [ ] Defects logged and prioritized
- [ ] Test summary report created
- [ ] Results reviewed with team

---

## 8. Sample Automation Test Code

### 8.1 API Test Example (Jest + Supertest)

```javascript
// backend/tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../server');

describe('Authentication API Tests', () => {
  
  test('TC-AUTH-001: Successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student1@test.com',
        password: 'Student123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.role).toBe('student');
  });

  test('TC-AUTH-002: Login fails with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'AnyPass123!'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Email hoặc password không đúng');
  });

  test('TC-AUTH-006: Account locked after multiple attempts', async () => {
    // Attempt login multiple times
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student1@test.com',
          password: 'WrongPass!'
        });
    }
    
    // Final attempt should be locked
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student1@test.com',
        password: 'CorrectPass123!'
      });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('bị khóa');
  });
});
```

### 8.2 E2E Test Example (Playwright)

```javascript
// frontend/tests/e2e/booking.spec.js
const { test, expect } = require('@playwright/test');

test('TC-BOOK-001: Book class successfully', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'student1@test.com');
  await page.fill('#password', 'Student123!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard');
  
  // Navigate to available classes
  await page.click('text=Available Classes');
  
  // Select first available class
  await page.click('.class-card:first-child button');
  
  // Verify success message
  await expect(page.locator('.success-message')).toContainText('Đặt lịch thành công');
});
```

---

## 9. Decision Matrix: Manual vs Automation

| Criteria | Manual Testing | Automation Testing |
|----------|----------------|-------------------|
| **Speed** | Slow (human execution) | Fast (script execution) |
| **Cost (initial)** | Low | High (setup time) |
| **Cost (long-term)** | High (repeated execution) | Low (run anytime) |
| **Exploratory** | ✅ Excellent | ❌ Not suitable |
| **UI/UX Validation** | ✅ Excellent | ⚠️ Limited |
| **Regression** | ⚠️ Time-consuming | ✅ Excellent |
| **Complex Scenarios** | ✅ Flexible | ⚠️ Requires coding |
| **Reproducibility** | ⚠️ Can vary | ✅ Consistent |
| **Maintenance** | Low | High (code updates) |

---

## 10. Recommendations

### ✅ For Your Project:

1. **Start with Manual Testing**
   - Execute all 59 test cases manually first
   - Use CSV tracker to record results
   - Find and fix critical bugs

2. **Then Automate Critical Paths**
   - Automate Login tests (TC-AUTH-001 to TC-AUTH-020)
   - Automate Booking tests (TC-BOOK-001 to TC-BOOK-021)
   - Use API tests (faster than E2E)

3. **Tools Recommendation**
   - **Quick Start**: Use Postman for API testing (can export to automation)
   - **Advanced**: Use Jest + Supertest for backend API tests
   - **E2E**: Use Playwright for critical user flows

4. **CI/CD Integration**
   - Run automated tests on every commit
   - Block deployment if critical tests fail

---

## 11. Next Steps

1. ✅ **Review this strategy** with your team
2. ✅ **Start manual testing** with high-priority cases
3. ✅ **Choose automation tools** based on your team's skills
4. ✅ **Set up test environment** for automation
5. ✅ **Create automation scripts** for critical tests

---

## Appendix: Tool Setup Guides

### A. Postman Collection Setup
1. Create Postman collection
2. Add all API endpoints
3. Add test assertions
4. Export as JSON
5. Run with Newman (CLI)

### B. Jest Setup (Node.js)
```bash
npm install --save-dev jest supertest
```

### C. Playwright Setup (E2E)
```bash
npm install --save-dev @playwright/test
npx playwright install
```

---

**Document End**

*Last Updated: November 27, 2025*

