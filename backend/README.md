# CNPM Tutor System - Backend

## 🎯 Hệ thống 3 cấp bậc (Role/Status)

Hệ thống hỗ trợ 3 loại tài khoản với quyền hạn khác nhau:

### 1. **STUDENT** (Sinh viên)
- Xem danh sách lớp học
- Đăng ký lớp học (booking)
- Xem lịch tư vấn của mình
- Truy cập thư viện tài liệu
- Cập nhật thông tin cá nhân
- Đăng ký làm instructor (nếu đủ điều kiện)

### 2. **INSTRUCTOR** (Giảng viên)
- Tất cả quyền của Student
- Tạo/Sửa/Xóa lớp học
- Quản lý lịch dạy
- Xem danh sách sinh viên đăng ký
- Duyệt/Từ chối booking
- Đóng góp tài liệu vào thư viện

### 3. **ADMIN** (Quản trị viên)
- Toàn quyền trên hệ thống
- Quản lý user (Student, Instructor)
- Duyệt đơn đăng ký làm Instructor
- Quản lý toàn bộ lớp học, booking, schedule

---

## 🔑 Tài khoản Test

Hệ thống đã tạo sẵn 3 tài khoản để test:

| Role       | Email                | Password | Mô tả              |
|------------|----------------------|----------|--------------------|
| **ADMIN**      | admin@test.com       | 123456   | Quản trị viên      |
| **INSTRUCTOR** | instructor@test.com  | 123456   | Giảng viên         |
| **STUDENT**    | student@test.com     | 123456   | Sinh viên          |

---

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình file `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cnpm_tutor_db

JWT_SECRET=cnpm-tutor-system-jwt-secret-2025
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=refresh-token-secret-2025
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

### 3. Seed dữ liệu (Tạo 3 tài khoản test)
```bash
node src/seeds/seedUsers.js
```

Output:
```
✅ Created ADMIN: admin@test.com / 123456
✅ Created INSTRUCTOR: instructor@test.com / 123456
✅ Created STUDENT: student@test.com / 123456
```

### 4. Chạy server
```bash
npm start
# hoặc
node src/app.js
```

Server chạy tại: `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register       - Đăng ký tài khoản
POST   /api/auth/login          - Đăng nhập
POST   /api/auth/logout         - Đăng xuất (protected)
POST   /api/auth/refresh-token  - Refresh token
GET    /api/auth/me             - Lấy thông tin user (protected)
```

### Test Login
```bash
# Test với ADMIN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Test với INSTRUCTOR
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@test.com","password":"123456"}'

# Test với STUDENT
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"123456"}'
```

---

## 🔐 Phân quyền (Permissions)

### Admin
- `all` - Toàn quyền

### Instructor
- `read:classes`, `create:classes`, `update:classes`, `delete:classes`
- `read:students`, `read:student-details`
- `create:schedules`, `update:schedules`, `delete:schedules`
- `read:bookings`, `update:bookings`, `approve:bookings`, `reject:bookings`
- `read:library`, `create:library-resources`

### Student
- `read:classes`
- `create:bookings`, `read:own-bookings`, `cancel:own-bookings`
- `read:library`, `read:own-history`
- `apply:instructor`

---

## 📝 Response Format

### Login Success
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "admin",
    "email": "admin@test.com",
    "role": "admin",
    "fullName": "Admin Test",
    "avatar": null
  }
}
```

### Login Failed
```json
{
  "success": false,
  "message": "Email hoặc password không đúng."
}
```

---

## 🗂️ Cấu trúc Database

### User Schema
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (enum: ['admin', 'instructor', 'student', 'pending_instructor']),
  status: String (alias of role),
  fullName: String,
  phoneNumber: String,
  avatar: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  loginAttempts: Number,
  lockUntil: Date,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛡️ Security Features

1. **Password Hashing**: bcrypt với 10 rounds
2. **JWT Token**: Access token (24h) + Refresh token (7d)
3. **Login Attempts**: Khóa tài khoản sau 5 lần đăng nhập sai
4. **Account Lock**: Tự động khóa 30 phút
5. **Token Refresh**: Tự động gia hạn session

---

## 📞 Support

Email: support@cnpm-tutor.com
