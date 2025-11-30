# 🧪 Automation Test Suite

## BK Tutor - Automated Test Cases

Test suite cho các test cases khó test manual hoặc cần automation.

---

## 📁 Test Structure

```
tests/
├── setup.js                    # Test setup configuration
├── integration/                # API integration tests
│   └── booking.test.js        # Booking API tests
├── performance/                # Performance & load tests
│   ├── login.load.test.js     # Login performance (TC-PERF-001)
│   ├── booking.load.test.js   # Booking performance (TC-PERF-002)
│   └── db.connection.test.js  # DB connection pool (TC-PERF-003)
└── README.md                   # This file
```

---

## ✅ Test Cases Covered

### Integration Tests (booking.test.js)

| TC-ID | Description | Status |
|-------|-------------|--------|
| TC-BOOK-006 | Book class with non-existent class ID | ✅ |
| TC-BOOK-009 | Cancel booking < 3 hours before class | ✅ |
| TC-BOOK-010 | Cancel already cancelled booking | ✅ |
| TC-BOOK-011 | Cancel another user's booking | ✅ |
| TC-BOOK-012 | Cancel booking without bookingId | ✅ |
| TC-BOOK-015 | Change booking to cancelled class | ✅ |
| TC-BOOK-016 | Change booking < 3 hours before old class | ✅ |

### Performance Tests

| TC-ID | Description | Status |
|-------|-------------|--------|
| TC-PERF-001 | Login response time (100 concurrent users) | ✅ |
| TC-PERF-002 | Booking response time (300 concurrent users) | ✅ |
| TC-PERF-003 | DB connection pool under sustained load | ✅ |

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Integration tests only
npm test -- --testPathPattern=integration

# Performance tests only
npm test -- --testPathPattern=performance

# Specific test file
npm test -- booking.test.js
```

### Run with Coverage

```bash
npm run test:coverage
```

---

## 📋 Prerequisites

- Node.js installed
- MongoDB running locally
- Backend dependencies installed (`npm install`)
- Test database accessible (or use test database)

---

## 🔧 Configuration

Tests sử dụng:
- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **Mongoose** - Database operations

Configuration files:
- `jest.config.js` - Jest configuration
- `tests/setup.js` - Global test setup
- `.env.test` - Test environment variables (optional)

---

## 📊 Expected Test Results

```
PASS  tests/integration/booking.test.js
  Booking API Integration Tests
    ✓ TC-BOOK-006: Book class with non-existent class ID (45ms)
    ✓ TC-BOOK-009: Cancel booking less than 3 hours before class (89ms)
    ✓ TC-BOOK-010: Cancel booking that is already cancelled (32ms)
    ✓ TC-BOOK-011: Cancel another user's booking (41ms)
    ✓ TC-BOOK-012: Cancel booking without bookingId (25ms)
    ✓ TC-BOOK-015: Change booking to cancelled class (67ms)
    ✓ TC-BOOK-016: Change booking less than 3 hours before old class (78ms)

PASS  tests/performance/login.load.test.js
  ✓ TC-PERF-001: Login Performance Test (5234ms)

PASS  tests/performance/booking.load.test.js
  ✓ TC-PERF-002: Booking Service Performance Test (15234ms)

PASS  tests/performance/db.connection.test.js
  ✓ TC-PERF-003: Database Connection Pool Test (600234ms)

Test Suites: 4 passed, 4 total
Tests:       10 passed, 10 total
Time:        625.234 s
```

---

## ⚠️ Notes

1. **Performance tests** có thể mất nhiều thời gian (đặc biệt TC-PERF-003 chạy 10 phút)
2. **Test data** được tự động tạo và cleanup sau mỗi test run
3. **Database** cần accessible, tests sẽ tạo và xóa test data

---

## 📝 Updating Test Results

Sau khi chạy tests, cập nhật kết quả vào:
- `docs/TEST_CASES_TRACKER.csv`
- `docs/TEST_SUMMARY_REPORT.md`

---

## 🔗 Related Documentation

- [Automation Setup Guide](./AUTOMATION_SETUP_GUIDE.md)
- [Testing Strategy](../docs/TESTING_STRATEGY.md)
- [Test Cases Document](../docs/TEST_CASES.md)

---

**Last Updated:** November 27, 2025

