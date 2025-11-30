/**
 * SEED DATABASE - Tạo 3 tài khoản test
 * Chạy file này để tạo sẵn tài khoản admin, instructor, student
 * 
 * Command: node src/seeds/seedUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { connectDB } = require('../config/db');

// Dữ liệu 3 tài khoản test
const testUsers = [
  {
    username: 'admin',
    email: 'admin@test.com',
    password: '123456',
    role: 'admin',
    fullName: 'Admin Test',
    phoneNumber: '0901234567',
    isEmailVerified: true,
    isActive: true
  },
  {
    username: 'instructor',
    email: 'instructor@test.com',
    password: '123456',
    role: 'instructor',
    fullName: 'Instructor Test',
    major: 'Mathematics',
    phoneNumber: '0901234568',
    isEmailVerified: true,
    isActive: true

  },
  {
    username: 'student',
    email: 'student@test.com',
    password: '123456',
    role: 'student',
    fullName: 'Student Test',
    phoneNumber: '0901234569',
    isEmailVerified: true,
    isActive: true,
    studentId: '2152001',
    GPA: 3.45,
    major: 'Computer Science',
    faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
    academicYear: '2021-2025',
    conductScore: 85,
    subjects: [
      { subjectCode: 'CTDL', subjectName: 'Cấu trúc dữ liệu', grade: 8.5 },
      { subjectCode: 'CNPM', subjectName: 'Công nghệ phần mềm', grade: 8.0 },
      { subjectCode: 'CSDL', subjectName: 'Cơ sở dữ liệu', grade: 9.0 },
      { subjectCode: 'OOP', subjectName: 'Lập trình hướng đối tượng', grade: 8.7 }
    ]
  },
  {
    username: 'student2',
    email: 'student2@test.com',
    password: '123456',
    role: 'student',
    fullName: 'Nguyen Van A',
    phoneNumber: '0901234570',
    isEmailVerified: true,
    isActive: true,
    studentId: '2152002',
    GPA: 3.78,
    major: 'Software Engineering',
    faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
    academicYear: '2021-2025',
    conductScore: 92,
    subjects: [
      { subjectCode: 'CTDL', subjectName: 'Cấu trúc dữ liệu', grade: 9.2 },
      { subjectCode: 'CNPM', subjectName: 'Công nghệ phần mềm', grade: 9.5 },
      { subjectCode: 'CSDL', subjectName: 'Cơ sở dữ liệu', grade: 9.0 },
      { subjectCode: 'AI', subjectName: 'Trí tuệ nhân tạo', grade: 9.3 }
    ]
  },
  {
    username: 'student3',
    email: 'student3@test.com',
    password: '123456',
    role: 'student',
    fullName: 'Le Thi Cam',
    phoneNumber: '0901567690',
    isEmailVerified: true,
    isActive: true,
    studentId: '2152003',
    GPA: 3.78,
    major: 'Software Engineering',
    faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
    academicYear: '2021-2025',
    conductScore: 90,
    subjects: [
      { subjectCode: 'CTDL', subjectName: 'Cấu trúc dữ liệu và giải thuật', grade: 8.5 },
      { subjectCode: 'CNPM', subjectName: 'Công nghệ phần mềm', grade: 8.0 },
      { subjectCode: 'CSDL', subjectName: 'Cơ sở dữ liệu', grade: 9.0 },
      { subjectCode: 'CTRR', subjectName: 'Cấu trúc rời rạc', grade: 8.7 }
    ]
  },
  {
    username: 'student4',
    email: 'student4@test.com',
    password: '123456',
    role: 'student',
    fullName: 'Nguyen Thi B',
    phoneNumber: '0901567691',
    isEmailVerified: true,
    isActive: true,
    studentId: '2152004',
    GPA: 3.56,
    major: 'Cyber Security',
    faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
    academicYear: '2021-2025',
    conductScore: 90,
    subjects: [
      { subjectCode: 'CTDL', subjectName: 'Cấu trúc dữ liệu và giải thuật', grade: 8.5 },
      { subjectCode: 'ML', subjectName: 'Machine Learning', grade: 8.0 },
      { subjectCode: 'CSDL', subjectName: 'Cơ sở dữ liệu', grade: 9.0 },
      { subjectCode: 'KTLT', subjectName: 'Kỹ Thuật Lập Trình', grade: 8.7 }
    ]
  },
  {
    username: 'student5',
    email: 'student5@test.com',
    password: '123456',
    role: 'student',
    fullName: 'Nguyen Thi C',
    phoneNumber: '0901567692',
    isEmailVerified: true,
    isActive: true,
    studentId: '2152005',
    GPA: 3.92,
    major: 'Computer Science',
    faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
    academicYear: '2021-2025',
    conductScore: 90,
    subjects: [
      { subjectCode: 'CSDL', subjectName: 'Cơ sở dữ liệu', grade: 8.5 },
      { subjectCode: 'GT1', subjectName: 'Giải tích 1', grade: 8.0 },
      { subjectCode: 'DSTT', subjectName: 'Đại số tuyến tính', grade: 9.0 },
      { subjectCode: 'GT2', subjectName: 'Giải tích 2', grade: 8.7 }
    ]
  }
];

// Seed function - có thể được gọi từ server.js hoặc chạy độc lập
const seedUsers = async (closeConnection = false) => {
  try {
    console.log('\n🌱 Starting seed process...\n');

    // Xóa các tài khoản test cũ (nếu có)
    await User.deleteMany({ 
      email: { $in: testUsers.map(u => u.email) } 
    });
    console.log('🗑️  Deleted old test accounts');

    // Tạo tài khoản mới
    for (const userData of testUsers) {
      const user = new User({
        ...userData
      });

      await user.save();
      console.log(`✅ Created ${userData.role.toUpperCase()}: ${userData.email} / ${userData.password}`);
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📋 TEST ACCOUNTS:');
    console.log('┌─────────────┬──────────────────────┬────────────┐');
    console.log('│ Role        │ Email                │ Password   │');
    console.log('├─────────────┼──────────────────────┼────────────┤');
    console.log('│ ADMIN       │ admin@test.com       │ 123456     │');
    console.log('│ INSTRUCTOR  │ instructor@test.com  │ 123456     │');
    console.log('│ STUDENT     │ student@test.com     │ 123456     │');
    console.log('│ STUDENT 2   │ student2@test.com    │ 123456     │');
    console.log('│ STUDENT 3   │ student3@test.com    │ 123456     │');
    console.log('│ STUDENT 4   │ student4@test.com    │ 123456     │');
    console.log('│ STUDENT 5   │ student5@test.com    │ 123456     │');
    console.log('└─────────────┴──────────────────────┴────────────┘\n');

    return { success: true };

  } catch (error) {
    console.error('❌ Seed failed:', error);
    return { success: false, error: error.message };
  } finally {
    // Chỉ đóng connection nếu chạy độc lập
    if (closeConnection) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      process.exit(0);
    }
  }
};

// Export để có thể import từ server.js
module.exports = { seedUsers };

// Chạy seed độc lập nếu file được chạy trực tiếp
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedUsers(true); // true = đóng connection sau khi xong
  })();
}
