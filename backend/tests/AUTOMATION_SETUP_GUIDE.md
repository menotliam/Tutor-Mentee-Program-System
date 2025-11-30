# 🤖 AUTOMATION TESTING SETUP GUIDE

## BK Tutor - Automation Testing Setup

Hướng dẫn chi tiết để setup và chạy automation tests cho các test cases còn lại.

---

## 📋 Test Cases Cần Automation

| TC-ID | Test Case | Status |
|-------|-----------|--------|
| TC-BOOK-006 | Book class with non-existent class ID | ✅ Created |
| TC-BOOK-009 | Cancel booking < 3 hours before class | ✅ Created |
| TC-BOOK-010 | Cancel already cancelled booking | ✅ Created |
| TC-BOOK-011 | Cancel another user's booking | ✅ Created |
| TC-BOOK-012 | Cancel booking without bookingId | ✅ Created |
| TC-BOOK-015 | Change booking to cancelled class | ✅ Created |
| TC-BOOK-016 | Change booking < 3 hours before old class | ✅ Created |
| TC-PERF-001 | Login response time (100 concurrent) | ✅ Created |
| TC-PERF-002 | Booking response time (300 concurrent) | ✅ Created |
| TC-PERF-003 | DB connection pool under load | ✅ Created |

---

## 🚀 Setup Instructions

### Step 1: Cài đặt Dependencies

```bash
cd backend
npm install --save-dev jest supertest
```

Hoặc nếu bạn đã có package.json đã được update:

```bash
npm install
```

### Step 2: Kiểm tra File Structure

Đảm bảo bạn có cấu trúc thư mục sau:

```
backend/
├── tests/
│   ├── setup.js                          # ✅ Đã tạo
│   ├── integration/
│   │   └── booking.test.js               # ✅ Đã tạo
│   └── performance/
│       ├── login.load.test.js            # ✅ Đã tạo
│       ├── booking.load.test.js          # ✅ Đã tạo
│       └── db.connection.test.js         # ✅ Đã tạo
├── jest.config.js                        # ✅ Đã tạo
└── package.json                          # ✅ Đã update
```

### Step 3: Cấu hình Test Environment

Tạo file `.env.test` (optional, cho test environment riêng):

```bash
# backend/.env.test
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/cnpm_tutor_test
PORT=5001
```

Hoặc sử dụng `.env` hiện tại.

---

## 🧪 Chạy Tests

### Chạy Tất Cả Tests

```bash
npm test
```

### Chạy Integration Tests Only

```bash
npm run test:integration
```

### Chạy Performance Tests Only

```bash
npm test -- --testPathPattern=performance
```

### Chạy Test Cụ Thể

```bash
# Chạy test file booking.test.js
npm test -- booking.test.js

# Chạy test case cụ thể
npm test -- -t "TC-BOOK-006"
```

### Chạy với Coverage Report

```bash
npm run test:coverage
```

### Watch Mode (tự động chạy lại khi code thay đổi)

```bash
npm run test:watch
```

---

## 📊 Test Results

### Kết quả mong đợi:

```
PASS  tests/integration/booking.test.js
  Booking API Integration Tests
    ✓ TC-BOOK-006: Book class with non-existent class ID
    ✓ TC-BOOK-009: Cancel booking less than 3 hours before class
    ✓ TC-BOOK-010: Cancel booking that is already cancelled
    ✓ TC-BOOK-011: Cancel another user's booking
    ✓ TC-BOOK-012: Cancel booking without bookingId
    ✓ TC-BOOK-015: Change booking to cancelled class
    ✓ TC-BOOK-016: Change booking less than 3 hours before old class

PASS  tests/performance/login.load.test.js
  ✓ TC-PERF-001: Login Performance Test

PASS  tests/performance/booking.load.test.js
  ✓ TC-PERF-002: Booking Service Performance Test

PASS  tests/performance/db.connection.test.js
  ✓ TC-PERF-003: Database Connection Pool Test

Test Suites: 4 passed, 4 total
Tests:       10 passed, 10 total
```

---

## ⚠️ Troubleshooting

### Issue 1: "Cannot find module '../../server'"

**Problem:** Jest không tìm thấy server module

**Solution:**
- Đảm bảo `backend/server.js` export app: `module.exports = app;`
- Kiểm tra đường dẫn import trong test files

---

### Issue 2: "MongoDB connection failed"

**Problem:** Không kết nối được database

**Solution:**
1. Đảm bảo MongoDB đang chạy:
   ```bash
   mongod
   ```
2. Kiểm tra MONGODB_URI trong `.env`
3. Test connection:
   ```bash
   mongo mongodb://localhost:27017/cnpm_tutor_test
   ```

---

### Issue 3: "Test timeout exceeded"

**Problem:** Test chạy quá lâu

**Solution:**
- Tăng timeout trong `jest.config.js`:
  ```javascript
  testTimeout: 30000 // 30 seconds
  ```
- Hoặc trong test file:
  ```javascript
  test('...', async () => {
    // test code
  }, 30000); // 30 second timeout
  ```

---

### Issue 4: "Port already in use"

**Problem:** Server đang chạy trên port test

**Solution:**
- Dừng server đang chạy
- Hoặc đổi PORT trong test environment

---

### Issue 5: Test data conflicts

**Problem:** Test data từ lần chạy trước còn sót lại

**Solution:**
- Tests tự động cleanup trong `afterAll()`
- Hoặc chạy cleanup manual:
  ```javascript
  // Trong MongoDB shell
  use cnpm_tutor_test
  db.users.deleteMany({ email: /test.*@test\.com/ })
  db.classes.deleteMany({ name: /Test.*/ })
  db.bookings.deleteMany({})
  ```

---

## 🔧 Customize Tests

### Thêm Test Case Mới

1. Mở file test tương ứng (ví dụ: `booking.test.js`)
2. Thêm describe block mới:

```javascript
describe('TC-BOOK-XXX: New test case', () => {
  test('should ...', async () => {
    // Test implementation
  });
});
```

### Thay Đổi Test Data

Sửa trong `beforeAll()` của test file:

```javascript
beforeAll(async () => {
  // Thay đổi email, password, etc.
  const student = await User.create({
    email: 'your-test-email@test.com',
    password: 'YourPassword123!',
    // ...
  });
});
```

### Adjust Performance Targets

Sửa constants trong performance test files:

```javascript
const CONCURRENT_USERS = 300; // Thay đổi số lượng users
const TARGET_AVG_RESPONSE_TIME = 1000; // Thay đổi target
```

---

## 📝 Recording Test Results

Sau khi chạy tests, cập nhật `TEST_CASES_TRACKER.csv`:

| TC-ID | Status | Test Date | Actual Result | Notes |
|-------|--------|-----------|---------------|-------|
| TC-BOOK-006 | ✅ Pass | 27/11/2025 | "Error 500 returned, message contains 'Lớp học không tồn tại'" | Automated test |
| TC-BOOK-009 | ✅ Pass | 27/11/2025 | "Error returned with 'Quá trễ để hủy lịch'" | Automated test |
| ... | ... | ... | ... | ... |

---

## 🎯 Next Steps

1. ✅ **Run all tests** để verify setup
2. ✅ **Fix any failures** nếu có
3. ✅ **Update CSV tracker** với test results
4. ✅ **Integrate với CI/CD** (nếu có)

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Document End**

*Last Updated: November 27, 2025*

