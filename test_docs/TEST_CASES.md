# 📋 TEST CASES DOCUMENT

## Tutor Management System - BK Tutor

| **Document Information** | |
|--------------------------|--|
| **Project Name** | BK Tutor - Tutor Management System |
| **Version** | 1.0 |
| **Created Date** | November 27, 2025 |
| **Author** | QC Team |
| **Status** | Draft |
| **Reviewed By** | - |
| **Approved By** | - |

---

## 📑 Table of Contents

1. [Document Overview](#1-document-overview)
2. [Test Environment](#2-test-environment)
3. [Test Scope](#3-test-scope)
4. [Test Cases - Authentication Module](#4-test-cases---authentication-module)
5. [Test Cases - Booking Module](#5-test-cases---booking-module)
6. [Test Cases - Profile Management](#6-test-cases---profile-management)
7. [Test Cases - Admin Module](#7-test-cases---admin-module)
8. [Test Cases - UI/UX Testing](#8-test-cases---uiux-testing)
9. [Performance Requirements](#9-performance-requirements)
10. [Test Summary](#10-test-summary)

---

## 1. Document Overview

### 1.1 Purpose
This document provides comprehensive test cases for the BK Tutor system to ensure all functionalities work correctly before deployment.

### 1.2 System Overview
BK Tutor is a tutoring management system that connects students with tutors. The system allows students to book tutoring sessions, view schedules, and manage their profiles.

### 1.3 Key Business Rules
| Rule ID | Description |
|---------|-------------|
| BR-001 | System does NOT have self-registration. Admin creates all user accounts. |
| BR-002 | One user can have only ONE role: Student, Tutor, or Admin |
| BR-003 | Students can apply to become tutors (future feature) |
| BR-004 | Booking statuses: ACTIVE, CANCELLED, COMPLETED |
| BR-005 | Students can cancel ACTIVE bookings if cancelled 3 hours before class starts |
| BR-006 | Tutors can reject booking requests |
| BR-007 | Students can book multiple tutors at the same time |
| BR-008 | Time slots are fixed (not free selection) |

### 1.4 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Create/Manage users, Full system access |
| **Tutor** | Manage own schedule, View student list, Reject bookings |
| **Student** | Book classes, View schedule, Cancel bookings, Update profile |

---

## 2. Test Environment

### 2.1 Environment Setup
| Component | Details |
|-----------|---------|
| **Backend** | Node.js + Express |
| **Database** | MongoDB |
| **Frontend** | React + Vite |
| **Authentication** | JWT (Access Token + Refresh Token) |

### 2.2 Browser Compatibility
| Browser | Version | Priority |
|---------|---------|----------|
| Google Chrome | Latest | High |
| Mozilla Firefox | Latest | High |
| Microsoft Edge | Latest | Medium |
| Safari | Latest | Medium |

### 2.3 Test Data Requirements
- Pre-created Admin account
- Pre-created Student accounts (minimum 5)
- Pre-created Tutor accounts (minimum 3)
- Pre-created Classes with various time slots

---

## 3. Test Scope

### 3.1 In Scope
| Module | Features |
|--------|----------|
| Authentication | Login, Logout, Forgot Password, Reset Password |
| Booking Service | Book, Cancel, Change, View bookings |
| Profile | View profile, Update profile (Student) |
| Calendar | View schedule (Student & Tutor) |
| Class List | View available classes |
| History | View booking history |
| Library | Document management |
| Admin Panel | User management |
| Notifications | Email notifications |

### 3.2 Out of Scope
| Feature | Reason |
|---------|--------|
| Registration | Not implemented per business requirement |
| Mobile App | Not in current release |
| Mobile Responsive | Not required for current release |

### 3.3 Focus Areas (High Priority)
1. **🔐 Login Functionality** - Critical for system access
2. **📅 Booking Service** - Core business functionality

---

## 4. Test Cases - Authentication Module

### 4.1 Login (HIGH PRIORITY ⭐)

| TC-ID | TC-AUTH-001 |
|-------|-------------|
| **Title** | Successful login with valid credentials |
| **Priority** | HIGH |
| **Preconditions** | User account exists and is active |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter valid email<br>3. Enter valid password<br>4. Click "Login" button |
| **Test Data** | Email: valid@test.com, Password: ValidPass123! |
| **Expected Result** | - Login successful<br>- Redirect to home page<br>- Access token received<br>- User info displayed |
| **Status** | - |

---

| TC-ID | TC-AUTH-002 |
|-------|-------------|
| **Title** | Login fails with invalid email |
| **Priority** | HIGH |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter non-existent email<br>3. Enter any password<br>4. Click "Login" button |
| **Test Data** | Email: nonexistent@test.com, Password: AnyPass123! |
| **Expected Result** | - Error message: "Email hoặc password không đúng"<br>- Remain on login page<br>- No token issued |
| **Status** | - |

---

| TC-ID | TC-AUTH-003 |
|-------|-------------|
| **Title** | Login fails with invalid password |
| **Priority** | HIGH |
| **Preconditions** | User account exists |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter valid email<br>3. Enter wrong password<br>4. Click "Login" button |
| **Test Data** | Email: valid@test.com, Password: WrongPass! |
| **Expected Result** | - Error message: "Email hoặc password không đúng"<br>- Login attempts incremented<br>- Remain on login page |
| **Status** | - |

---

| TC-ID | TC-AUTH-004 |
|-------|-------------|
| **Title** | Login fails with empty email field |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to Login page<br>2. Leave email field empty<br>3. Enter password<br>4. Click "Login" button |
| **Test Data** | Email: (empty), Password: AnyPass123! |
| **Expected Result** | - Error message: "Email và password là bắt buộc"<br>- Remain on login page |
| **Status** | - |

---

| TC-ID | TC-AUTH-005 |
|-------|-------------|
| **Title** | Login fails with empty password field |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter valid email<br>3. Leave password field empty<br>4. Click "Login" button |
| **Test Data** | Email: valid@test.com, Password: (empty) |
| **Expected Result** | - Error message: "Email và password là bắt buộc"<br>- Remain on login page |
| **Status** | - |

---

| TC-ID | TC-AUTH-006 |
|-------|-------------|
| **Title** | Account locked after multiple failed login attempts |
| **Priority** | HIGH |
| **Preconditions** | User account exists, not locked |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter valid email<br>3. Enter wrong password<br>4. Repeat steps 2-3 until max attempts reached |
| **Test Data** | Email: valid@test.com, Password: WrongPass! (multiple times) |
| **Expected Result** | - Account locked after max attempts<br>- Error message with lock duration<br>- Unable to login even with correct password |
| **Status** | - |

---

| TC-ID | TC-AUTH-007 |
|-------|-------------|
| **Title** | Login fails for inactive account |
| **Priority** | HIGH |
| **Preconditions** | User account exists but isActive = false |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter email of inactive account<br>3. Enter correct password<br>4. Click "Login" button |
| **Test Data** | Email: inactive@test.com, Password: CorrectPass123! |
| **Expected Result** | - Error message: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ admin"<br>- No token issued |
| **Status** | - |

---

| TC-ID | TC-AUTH-008 |
|-------|-------------|
| **Title** | Login with email not verified |
| **Priority** | MEDIUM |
| **Preconditions** | User account exists, isEmailVerified = false, email verification required |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter email<br>3. Enter correct password<br>4. Click "Login" button |
| **Test Data** | Email: unverified@test.com, Password: CorrectPass123! |
| **Expected Result** | - Error message: "Vui lòng xác thực email trước khi đăng nhập"<br>- No token issued |
| **Status** | - |

---

| TC-ID | TC-AUTH-009 |
|-------|-------------|
| **Title** | Login with invalid email format |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to Login page<br>2. Enter invalid email format<br>3. Enter password<br>4. Click "Login" button |
| **Test Data** | Email: invalid-email, Password: AnyPass123! |
| **Expected Result** | - Validation error for email format<br>- Form not submitted |
| **Status** | - |

---

### 4.2 Logout

| TC-ID | TC-AUTH-010 |
|-------|-------------|
| **Title** | Successful logout |
| **Priority** | HIGH |
| **Preconditions** | User is logged in |
| **Test Steps** | 1. Click "Logout" button<br>2. Confirm logout if prompted |
| **Test Data** | N/A |
| **Expected Result** | - Logout successful<br>- Redirect to login page<br>- Token cleared<br>- Cookie cleared<br>- Cannot access protected pages |
| **Status** | - |

---

| TC-ID | TC-AUTH-011 |
|-------|-------------|
| **Title** | Session persistence after browser refresh |
| **Priority** | MEDIUM |
| **Preconditions** | User is logged in |
| **Test Steps** | 1. Login successfully<br>2. Refresh browser page<br>3. Check session status |
| **Test Data** | N/A |
| **Expected Result** | - User remains logged in<br>- No redirect to login page<br>- User info still displayed |
| **Status** | - |

---

### 4.3 Forgot Password

| TC-ID | TC-AUTH-012 |
|-------|-------------|
| **Title** | Request password reset with valid email |
| **Priority** | HIGH |
| **Preconditions** | User account exists |
| **Test Steps** | 1. Navigate to Login page<br>2. Click "Forgot Password"<br>3. Enter registered email<br>4. Click "Send" button |
| **Test Data** | Email: valid@test.com |
| **Expected Result** | - Success message displayed<br>- Reset email sent (or token returned in dev mode)<br>- Password reset token stored in DB |
| **Status** | - |

---

| TC-ID | TC-AUTH-013 |
|-------|-------------|
| **Title** | Request password reset with non-existent email |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to Forgot Password page<br>2. Enter non-existent email<br>3. Click "Send" button |
| **Test Data** | Email: nonexistent@test.com |
| **Expected Result** | - Generic success message (security: don't reveal if email exists)<br>- "Nếu email tồn tại, bạn sẽ nhận được link reset password" |
| **Status** | - |

---

| TC-ID | TC-AUTH-014 |
|-------|-------------|
| **Title** | Password reset rate limiting |
| **Priority** | MEDIUM |
| **Preconditions** | User has requested password reset multiple times |
| **Test Steps** | 1. Request password reset<br>2. Repeat until max requests per day reached<br>3. Request again |
| **Test Data** | Email: valid@test.com |
| **Expected Result** | - Error message: "Bạn đã vượt quá số lần yêu cầu reset password trong ngày"<br>- Request blocked for 24 hours |
| **Status** | - |

---

### 4.4 Reset Password

| TC-ID | TC-AUTH-015 |
|-------|-------------|
| **Title** | Reset password with valid token |
| **Priority** | HIGH |
| **Preconditions** | User has valid password reset token |
| **Test Steps** | 1. Click reset link from email<br>2. Enter new password<br>3. Confirm new password<br>4. Click "Reset" button |
| **Test Data** | New Password: NewPass123!, Confirm: NewPass123! |
| **Expected Result** | - Password reset successful<br>- Message: "Reset password thành công!"<br>- Can login with new password |
| **Status** | - |

---

| TC-ID | TC-AUTH-016 |
|-------|-------------|
| **Title** | Reset password with mismatched confirmation |
| **Priority** | MEDIUM |
| **Preconditions** | User has valid password reset token |
| **Test Steps** | 1. Click reset link from email<br>2. Enter new password<br>3. Enter different confirmation password<br>4. Click "Reset" button |
| **Test Data** | New Password: NewPass123!, Confirm: Different456! |
| **Expected Result** | - Error message: "Password và confirm password không khớp"<br>- Password not reset |
| **Status** | - |

---

| TC-ID | TC-AUTH-017 |
|-------|-------------|
| **Title** | Reset password with weak password |
| **Priority** | MEDIUM |
| **Preconditions** | User has valid password reset token |
| **Test Steps** | 1. Click reset link from email<br>2. Enter weak password<br>3. Click "Reset" button |
| **Test Data** | New Password: 123, Confirm: 123 |
| **Expected Result** | - Error message: "Password không đủ mạnh"<br>- Password not reset |
| **Status** | - |

---

| TC-ID | TC-AUTH-018 |
|-------|-------------|
| **Title** | Reset password with expired token |
| **Priority** | HIGH |
| **Preconditions** | User has expired password reset token |
| **Test Steps** | 1. Click expired reset link<br>2. Enter new password<br>3. Click "Reset" button |
| **Test Data** | Token: (expired), New Password: NewPass123! |
| **Expected Result** | - Error message: "Token không hợp lệ hoặc đã hết hạn"<br>- Password not reset |
| **Status** | - |

---

### 4.5 Token Management

| TC-ID | TC-AUTH-019 |
|-------|-------------|
| **Title** | Access token refresh |
| **Priority** | HIGH |
| **Preconditions** | User has valid refresh token |
| **Test Steps** | 1. Wait for access token to expire<br>2. System auto-refreshes token<br>3. Verify new access token works |
| **Test Data** | Valid refresh token |
| **Expected Result** | - New access token issued<br>- User session continues without re-login |
| **Status** | - |

---

| TC-ID | TC-AUTH-020 |
|-------|-------------|
| **Title** | Access protected route without token |
| **Priority** | HIGH |
| **Preconditions** | User is not logged in |
| **Test Steps** | 1. Try to access protected API endpoint<br>2. Without authentication header |
| **Test Data** | N/A |
| **Expected Result** | - HTTP 401 Unauthorized<br>- Redirect to login page |
| **Status** | - |

---

## 5. Test Cases - Booking Module

### 5.1 Book Schedule (HIGH PRIORITY ⭐)

| TC-ID | TC-BOOK-001 |
|-------|-------------|
| **Title** | Successfully book a class |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Class exists with available slots<br>- Class start time is in the future |
| **Test Steps** | 1. Navigate to available classes<br>2. Select a subject<br>3. View available classes<br>4. Select a class<br>5. Click "Book" button |
| **Test Data** | classId: (valid class ID) |
| **Expected Result** | - Booking created with status "ACTIVE"<br>- Success message displayed<br>- Student added to class.students array<br>- Notification sent to student |
| **Status** | - |

---

| TC-ID | TC-BOOK-002 |
|-------|-------------|
| **Title** | Book class that is already full |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Class has reached maxCapacity |
| **Test Steps** | 1. Navigate to available classes<br>2. Try to book a full class |
| **Test Data** | classId: (full class ID) |
| **Expected Result** | - Error message: "Lớp đã đầy"<br>- Booking not created |
| **Status** | - |

---

| TC-ID | TC-BOOK-003 |
|-------|-------------|
| **Title** | Book class that has already started |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Class startTime is in the past |
| **Test Steps** | 1. Try to book a class that has already started |
| **Test Data** | classId: (past class ID) |
| **Expected Result** | - Error message: "Quá hạn đăng ký"<br>- Booking not created |
| **Status** | - |

---

| TC-ID | TC-BOOK-004 |
|-------|-------------|
| **Title** | Book class that has been cancelled |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Class.isCancelled = true |
| **Test Steps** | 1. Try to book a cancelled class |
| **Test Data** | classId: (cancelled class ID) |
| **Expected Result** | - Error message: "Lớp học đã bị hủy"<br>- Booking not created |
| **Status** | - |

---

| TC-ID | TC-BOOK-005 |
|-------|-------------|
| **Title** | Book same class twice |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Student already booked the class |
| **Test Steps** | 1. Book a class successfully<br>2. Try to book the same class again |
| **Test Data** | classId: (already booked class ID) |
| **Expected Result** | - Error message: "Bạn đã đăng ký lớp này rồi"<br>- Duplicate booking prevented |
| **Status** | - |

---

| TC-ID | TC-BOOK-006 |
|-------|-------------|
| **Title** | Book class with non-existent class ID |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Send booking request with invalid classId |
| **Test Data** | classId: "invalidClassId123" |
| **Expected Result** | - Error message: "Lớp học không tồn tại"<br>- Booking not created |
| **Status** | - |

---

| TC-ID | TC-BOOK-007 |
|-------|-------------|
| **Title** | Book multiple different classes |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Multiple classes available |
| **Test Steps** | 1. Book class A with tutor X<br>2. Book class B with tutor Y<br>3. Book class C with tutor Z |
| **Test Data** | Multiple valid class IDs |
| **Expected Result** | - All bookings created successfully<br>- Each booking has status "ACTIVE"<br>- Student can book multiple tutors |
| **Status** | - |

---

### 5.2 Cancel Booking (HIGH PRIORITY ⭐)

| TC-ID | TC-BOOK-008 |
|-------|-------------|
| **Title** | Cancel booking more than 3 hours before class |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Booking exists with status "ACTIVE"<br>- Class starts more than 3 hours from now |
| **Test Steps** | 1. Navigate to bookings list<br>2. Select a booking<br>3. Click "Cancel" button |
| **Test Data** | bookingId: (valid booking ID, >3 hours to class) |
| **Expected Result** | - Booking status changed to "CANCELLED"<br>- cancelledAt timestamp set<br>- Student removed from class.students<br>- Success message displayed |
| **Status** | - |

---

| TC-ID | TC-BOOK-009 |
|-------|-------------|
| **Title** | Cancel booking less than 3 hours before class |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Booking exists with status "ACTIVE"<br>- Class starts less than 3 hours from now |
| **Test Steps** | 1. Navigate to bookings list<br>2. Select a booking starting in < 3 hours<br>3. Click "Cancel" button |
| **Test Data** | bookingId: (booking ID, <3 hours to class) |
| **Expected Result** | - Error message: "Quá trễ để hủy lịch. Phải hủy trước ít nhất 3 giờ"<br>- Booking status remains "ACTIVE"<br>- Cancel blocked |
| **Status** | - |

---

| TC-ID | TC-BOOK-010 |
|-------|-------------|
| **Title** | Cancel booking that is already cancelled |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in<br>- Booking exists with status "CANCELLED" |
| **Test Steps** | 1. Try to cancel an already cancelled booking |
| **Test Data** | bookingId: (cancelled booking ID) |
| **Expected Result** | - Error message indicating booking not found or already cancelled<br>- No change in data |
| **Status** | - |

---

| TC-ID | TC-BOOK-011 |
|-------|-------------|
| **Title** | Cancel another user's booking |
| **Priority** | HIGH |
| **Preconditions** | - Student A is logged in<br>- Booking belongs to Student B |
| **Test Steps** | 1. Try to cancel a booking that belongs to another user |
| **Test Data** | bookingId: (another user's booking ID) |
| **Expected Result** | - Error message: "Bạn không có quyền hủy lịch này"<br>- HTTP 403 Forbidden<br>- Booking unchanged |
| **Status** | - |

---

| TC-ID | TC-BOOK-012 |
|-------|-------------|
| **Title** | Cancel booking without bookingId |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Send cancel request without bookingId |
| **Test Data** | bookingId: (empty/null) |
| **Expected Result** | - Error message: "Vui lòng cung cấp bookingId"<br>- HTTP 400 Bad Request |
| **Status** | - |

---

### 5.3 Change Booking

| TC-ID | TC-BOOK-013 |
|-------|-------------|
| **Title** | Change booking to different class successfully |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Old booking exists with status "ACTIVE"<br>- New class has available slots<br>- Old class starts >3 hours from now |
| **Test Steps** | 1. Navigate to bookings<br>2. Select booking to change<br>3. Select new class<br>4. Confirm change |
| **Test Data** | oldBookingId: (valid), newClassId: (valid) |
| **Expected Result** | - Old booking status changed to "CANCELLED"<br>- New booking created with status "ACTIVE"<br>- Student moved from old class to new class<br>- Success message with both class names |
| **Status** | - |

---

| TC-ID | TC-BOOK-014 |
|-------|-------------|
| **Title** | Change booking to full class |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- New class is full |
| **Test Steps** | 1. Try to change booking to a full class |
| **Test Data** | oldBookingId: (valid), newClassId: (full class) |
| **Expected Result** | - Error message: "Lớp mới đã đầy"<br>- Old booking remains unchanged |
| **Status** | - |

---

| TC-ID | TC-BOOK-015 |
|-------|-------------|
| **Title** | Change booking to cancelled class |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in<br>- New class is cancelled |
| **Test Steps** | 1. Try to change booking to a cancelled class |
| **Test Data** | oldBookingId: (valid), newClassId: (cancelled class) |
| **Expected Result** | - Error message: "Lớp mới đã bị hủy"<br>- Old booking remains unchanged |
| **Status** | - |

---

| TC-ID | TC-BOOK-016 |
|-------|-------------|
| **Title** | Change booking less than 3 hours before old class |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Old class starts < 3 hours from now |
| **Test Steps** | 1. Try to change a booking starting in < 3 hours |
| **Test Data** | oldBookingId: (<3 hours), newClassId: (valid) |
| **Expected Result** | - Error message: "Quá trễ để đổi lịch lớp cũ. Phải đổi trước ít nhất 3 giờ"<br>- Change blocked |
| **Status** | - |

---

| TC-ID | TC-BOOK-017 |
|-------|-------------|
| **Title** | Change booking to class already enrolled |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in<br>- Student already enrolled in new class |
| **Test Steps** | 1. Try to change to a class already enrolled |
| **Test Data** | oldBookingId: (valid), newClassId: (already enrolled) |
| **Expected Result** | - Error message: "Bạn đã đăng ký lớp mới rồi"<br>- Change blocked |
| **Status** | - |

---

### 5.4 View Bookings

| TC-ID | TC-BOOK-018 |
|-------|-------------|
| **Title** | View all bookings for logged-in user |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Student has bookings |
| **Test Steps** | 1. Navigate to bookings page<br>2. View booking list |
| **Test Data** | N/A |
| **Expected Result** | - All user's bookings displayed<br>- Sorted by createdAt (newest first)<br>- Each booking shows: className, tutorName, date, time, status |
| **Status** | - |

---

| TC-ID | TC-BOOK-019 |
|-------|-------------|
| **Title** | View bookings when user has no bookings |
| **Priority** | LOW |
| **Preconditions** | - Student is logged in<br>- Student has no bookings |
| **Test Steps** | 1. Navigate to bookings page |
| **Test Data** | N/A |
| **Expected Result** | - Empty state displayed<br>- Message indicating no bookings<br>- Option to book a class |
| **Status** | - |

---

### 5.5 Get Available Classes

| TC-ID | TC-BOOK-020 |
|-------|-------------|
| **Title** | View available classes |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Classes exist in the system |
| **Test Steps** | 1. Navigate to available classes page |
| **Test Data** | N/A |
| **Expected Result** | - Only future classes shown (startTime > now)<br>- Only non-cancelled classes shown<br>- Only classes with available slots shown<br>- Each class shows: name, tutor, date, time, availableSlots |
| **Status** | - |

---

| TC-ID | TC-BOOK-021 |
|-------|-------------|
| **Title** | Filter available classes by subject |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in<br>- Multiple subjects have classes |
| **Test Steps** | 1. Navigate to available classes<br>2. Select a subject filter |
| **Test Data** | Subject: "Mathematics" |
| **Expected Result** | - Only classes for selected subject shown<br>- Filter applied correctly |
| **Status** | - |

---

## 6. Test Cases - Profile Management

### 6.1 View Profile

| TC-ID | TC-PROF-001 |
|-------|-------------|
| **Title** | View student profile |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Navigate to profile page |
| **Test Data** | N/A |
| **Expected Result** | - Profile displayed with: username, email, fullName, phoneNumber, studentId, GPA, major, academicYear, conductScore |
| **Status** | - |

---

| TC-ID | TC-PROF-002 |
|-------|-------------|
| **Title** | View tutor profile |
| **Priority** | MEDIUM |
| **Preconditions** | - Tutor is logged in |
| **Test Steps** | 1. Navigate to profile page |
| **Test Data** | N/A |
| **Expected Result** | - Tutor profile displayed with relevant fields |
| **Status** | - |

---

### 6.2 Update Profile (Student)

| TC-ID | TC-PROF-003 |
|-------|-------------|
| **Title** | Update student profile - valid data |
| **Priority** | MEDIUM |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Navigate to profile page<br>2. Edit fullName, phoneNumber, studentId<br>3. Click "Save" button |
| **Test Data** | fullName: "New Name", phoneNumber: "0987654321", studentId: "2012345" |
| **Expected Result** | - Profile updated successfully<br>- Success message displayed<br>- New data persisted in database |
| **Status** | - |

---

| TC-ID | TC-PROF-004 |
|-------|-------------|
| **Title** | Update profile with invalid phone number |
| **Priority** | LOW |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Navigate to profile page<br>2. Enter invalid phone number<br>3. Click "Save" button |
| **Test Data** | phoneNumber: "abc123" |
| **Expected Result** | - Validation error: "Số điện thoại không hợp lệ"<br>- Profile not updated |
| **Status** | - |

---

| TC-ID | TC-PROF-005 |
|-------|-------------|
| **Title** | Update profile with invalid student ID |
| **Priority** | LOW |
| **Preconditions** | - Student is logged in |
| **Test Steps** | 1. Navigate to profile page<br>2. Enter invalid student ID format<br>3. Click "Save" button |
| **Test Data** | studentId: "ABC" |
| **Expected Result** | - Validation error: "Student ID không hợp lệ"<br>- Profile not updated |
| **Status** | - |

---

| TC-ID | TC-PROF-006 |
|-------|-------------|
| **Title** | Non-student tries to use student profile update API |
| **Priority** | MEDIUM |
| **Preconditions** | - Tutor is logged in |
| **Test Steps** | 1. Call PUT /api/auth/profile/student |
| **Test Data** | Any student profile data |
| **Expected Result** | - Error message: "API này chỉ dành cho student"<br>- HTTP 403 Forbidden |
| **Status** | - |

---

## 7. Test Cases - Admin Module

### 7.1 Admin Access Control

| TC-ID | TC-ADMIN-001 |
|-------|-------------|
| **Title** | Admin accesses admin panel |
| **Priority** | HIGH |
| **Preconditions** | - Admin is logged in |
| **Test Steps** | 1. Navigate to admin panel |
| **Test Data** | N/A |
| **Expected Result** | - Admin panel accessible<br>- Admin features displayed |
| **Status** | - |

---

| TC-ID | TC-ADMIN-002 |
|-------|-------------|
| **Title** | Non-admin tries to access admin panel |
| **Priority** | HIGH |
| **Preconditions** | - Student or Tutor is logged in |
| **Test Steps** | 1. Try to navigate to admin routes |
| **Test Data** | N/A |
| **Expected Result** | - Access denied<br>- HTTP 403 Forbidden<br>- Redirect to appropriate page |
| **Status** | - |

---

### 7.2 User Management

| TC-ID | TC-ADMIN-003 |
|-------|-------------|
| **Title** | Admin creates new user |
| **Priority** | HIGH |
| **Preconditions** | - Admin is logged in |
| **Test Steps** | 1. Navigate to user management<br>2. Click "Create User"<br>3. Fill user details<br>4. Select role<br>5. Submit |
| **Test Data** | username, email, password, role |
| **Expected Result** | - User created successfully<br>- User can login with credentials |
| **Status** | - |

---

| TC-ID | TC-ADMIN-004 |
|-------|-------------|
| **Title** | Admin deactivates user account |
| **Priority** | HIGH |
| **Preconditions** | - Admin is logged in<br>- Target user exists |
| **Test Steps** | 1. Navigate to user management<br>2. Select user<br>3. Click "Deactivate" |
| **Test Data** | userId: (target user) |
| **Expected Result** | - User.isActive = false<br>- User cannot login anymore |
| **Status** | - |

---

## 8. Test Cases - UI/UX Testing

### 8.1 Login Page UI

| TC-ID | TC-UI-001 |
|-------|-------------|
| **Title** | Login page displays correctly |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to login page<br>2. Verify all elements present |
| **Test Data** | N/A |
| **Expected Result** | - Email input field visible<br>- Password input field visible<br>- Login button visible<br>- Forgot password link visible<br>- Page responsive |
| **Status** | - |

---

| TC-ID | TC-UI-002 |
|-------|-------------|
| **Title** | Password field masks input |
| **Priority** | LOW |
| **Preconditions** | None |
| **Test Steps** | 1. Navigate to login page<br>2. Enter password<br>3. Observe input masking |
| **Test Data** | Password: "TestPass123" |
| **Expected Result** | - Password characters masked (dots or asterisks)<br>- Toggle show/hide if available |
| **Status** | - |

---

### 8.2 Calendar UI

| TC-ID | TC-UI-003 |
|-------|-------------|
| **Title** | Calendar displays booked classes correctly |
| **Priority** | HIGH |
| **Preconditions** | - Student is logged in<br>- Student has booked classes |
| **Test Steps** | 1. Navigate to Calendar page<br>2. View booked sessions |
| **Test Data** | N/A |
| **Expected Result** | - Booked sessions displayed on correct dates<br>- Class name visible<br>- Tutor name visible<br>- Time slot visible |
| **Status** | - |

---

### 8.3 Error Message Display

| TC-ID | TC-UI-004 |
|-------|-------------|
| **Title** | Error messages display clearly |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Trigger various error conditions<br>2. Observe error message display |
| **Test Data** | Various error scenarios |
| **Expected Result** | - Error messages visible and readable<br>- Appropriate styling (red/warning)<br>- Clear and actionable message text |
| **Status** | - |

---

### 8.4 Loading States

| TC-ID | TC-UI-005 |
|-------|-------------|
| **Title** | Loading states displayed during API calls |
| **Priority** | MEDIUM |
| **Preconditions** | None |
| **Test Steps** | 1. Perform action requiring API call<br>2. Observe loading state |
| **Test Data** | N/A |
| **Expected Result** | - Loading indicator displayed<br>- User interaction disabled during load<br>- Loading indicator removed after completion |
| **Status** | - |

---

## 9. Performance Requirements

### 9.1 Recommended Performance Benchmarks

| Metric | Target | Critical |
|--------|--------|----------|
| **Page Load Time** | < 2 seconds | < 4 seconds |
| **API Response Time** | < 500ms | < 1 second |
| **Time to Interactive** | < 3 seconds | < 5 seconds |
| **First Contentful Paint** | < 1.5 seconds | < 3 seconds |
| **Database Query Time** | < 100ms | < 500ms |

### 9.2 Load Testing Requirements

| Scenario | Expected Users | Target |
|----------|----------------|--------|
| **Normal Load** | 100 concurrent users | All responses < 1 second |
| **Peak Load** | 300 concurrent users | 95% responses < 2 seconds |
| **Stress Test** | 500 concurrent users | System remains stable |

### 9.3 Performance Test Cases

| TC-ID | TC-PERF-001 |
|-------|-------------|
| **Title** | Login response time under normal load |
| **Priority** | HIGH |
| **Test Steps** | 1. Simulate 100 concurrent login requests<br>2. Measure response times |
| **Expected Result** | - Average response time < 500ms<br>- 95th percentile < 1 second<br>- No failed requests |
| **Status** | - |

---

| TC-ID | TC-PERF-002 |
|-------|-------------|
| **Title** | Booking service response time under peak load |
| **Priority** | HIGH |
| **Test Steps** | 1. Simulate 300 concurrent booking requests<br>2. Measure response times |
| **Expected Result** | - Average response time < 1 second<br>- 95th percentile < 2 seconds<br>- Error rate < 1% |
| **Status** | - |

---

| TC-ID | TC-PERF-003 |
|-------|-------------|
| **Title** | Database connection pool under load |
| **Priority** | MEDIUM |
| **Test Steps** | 1. Simulate sustained load for 10 minutes<br>2. Monitor DB connections |
| **Expected Result** | - No connection pool exhaustion<br>- Connections properly released |
| **Status** | - |

---

## 10. Test Summary

### 10.1 Test Case Count by Module

| Module | Total | High | Medium | Low |
|--------|-------|------|--------|-----|
| Authentication | 20 | 12 | 6 | 2 |
| Booking | 21 | 14 | 5 | 2 |
| Profile | 6 | 0 | 4 | 2 |
| Admin | 4 | 3 | 1 | 0 |
| UI/UX | 5 | 1 | 3 | 1 |
| Performance | 3 | 2 | 1 | 0 |
| **TOTAL** | **59** | **32** | **20** | **7** |

### 10.2 Test Case Count by Priority

| Priority | Count | Percentage |
|----------|-------|------------|
| HIGH | 32 | 54% |
| MEDIUM | 20 | 34% |
| LOW | 7 | 12% |

### 10.3 Test Execution Template

| Date | Tester | Total Executed | Passed | Failed | Blocked | Notes |
|------|--------|----------------|--------|--------|---------|-------|
| | | | | | | |
| | | | | | | |

### 10.4 Defect Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System unusable, no workaround | Cannot login, data loss |
| **High** | Major feature broken, workaround exists | Booking fails intermittently |
| **Medium** | Feature works with issues | Slow response, UI glitch |
| **Low** | Minor issue, cosmetic | Typo, alignment issue |

---

## Appendix A: API Endpoints Reference

### Authentication APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password/:token | Reset password |
| POST | /api/auth/refresh-token | Refresh access token |
| GET | /api/auth/me | Get current user |
| GET | /api/auth/profile | Get full profile |
| PUT | /api/auth/profile/student | Update student profile |

### Booking APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/booking/book | Book a class |
| POST | /api/booking/cancel | Cancel a booking |
| POST | /api/booking/change | Change booking |
| GET | /api/booking/list | Get user's bookings |
| GET | /api/booking/available-classes | Get available classes |

---

## Appendix B: Test Data Requirements

### Required Test Users
| Role | Username | Email | Password | Notes |
|------|----------|-------|----------|-------|
| Admin | admin | admin@test.com | Admin123! | Full access |
| Student 1 | student1 | student1@test.com | Student123! | Active account |
| Student 2 | student2 | student2@test.com | Student123! | Active account |
| Student 3 | student3_inactive | student3@test.com | Student123! | Inactive (isActive=false) |
| Tutor 1 | tutor1 | tutor1@test.com | Tutor123! | Active account |
| Tutor 2 | tutor2 | tutor2@test.com | Tutor123! | Active account |

### Required Test Classes
| Class Name | Tutor | Start Time | Max Capacity | Notes |
|------------|-------|------------|--------------|-------|
| Math 101 | tutor1 | Future +24h | 2 | Available |
| Math 102 | tutor1 | Future +2h | 2 | For 3-hour rule test |
| Physics 101 | tutor2 | Future +24h | 2 | Available |
| Full Class | tutor2 | Future +24h | 2 | Full capacity |
| Cancelled Class | tutor1 | Future +24h | 2 | isCancelled=true |

---

**Document End**

*Last Updated: November 27, 2025*

