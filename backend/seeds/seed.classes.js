/**
 * SEED CLASSES - Tạo các lớp học mẫu để test booking
 * 
 * Command: node seeds/seed.classes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('../models/class.model');
const User = require('../models/user.model');
const { connectDB } = require('../config/db');

// Tạo các lớp học trong tuần tới
const generateClasses = (tutorId) => {
  const classes = [];
  const subjects = [
    'Cấu trúc dữ liệu',
    'Công nghệ phần mềm', 
    'Cơ sở dữ liệu',
    'Lập trình hướng đối tượng',
    'Trí tuệ nhân tạo',
    'Mạng máy tính',
    'Hệ điều hành',
    'Toán rời rạc'
  ];

  // Tạo lớp cho 7 ngày tiếp theo
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    
    // Mỗi ngày tạo 2-4 lớp
    const numClasses = Math.floor(Math.random() * 3) + 2;
    const hours = [8, 10, 14, 16, 19]; // Các khung giờ
    
    for (let i = 0; i < numClasses; i++) {
      const startTime = new Date(date);
      startTime.setHours(hours[i % hours.length], 0, 0, 0);
      
      classes.push({
        name: subjects[Math.floor(Math.random() * subjects.length)],
        tutorId: tutorId,
        startTime: startTime,
        maxCapacity: Math.floor(Math.random() * 3) + 2, // 2-4 chỗ
        students: [],
        isCancelled: false
      });
    }
  }

  return classes;
};

// Seed function
const seedClasses = async (closeConnection = false) => {
  try {
    console.log('\n🌱 Starting class seed process...\n');

    // Tìm instructor để gán làm tutor
    let instructor = await User.findOne({ role: 'instructor' });
    
    if (!instructor) {
      console.log('⚠️  Không tìm thấy instructor, sử dụng admin làm tutor');
      instructor = await User.findOne({ role: 'admin' });
    }

    if (!instructor) {
      console.error('❌ Không tìm thấy user nào để làm tutor. Hãy chạy seed.users.js trước.');
      return { success: false, error: 'No tutor found' };
    }

    console.log(`👨‍🏫 Sử dụng tutor: ${instructor.fullName || instructor.username} (${instructor.email})`);

    // Xóa các lớp cũ (optional - chỉ xóa lớp của tutor này)
    await Class.deleteMany({ tutorId: instructor._id });
    console.log('🗑️  Deleted old classes');

    // Tạo lớp mới
    const classData = generateClasses(instructor._id);
    
    for (const cls of classData) {
      const newClass = new Class(cls);
      await newClass.save();
      console.log(`✅ Created class: ${cls.name} - ${cls.startTime.toLocaleString('vi-VN')}`);
    }

    console.log('\n🎉 Class seed completed successfully!');
    console.log(`📚 Created ${classData.length} classes for the next 7 days\n`);

    return { success: true, count: classData.length };

  } catch (error) {
    console.error('❌ Class seed failed:', error);
    return { success: false, error: error.message };
  } finally {
    if (closeConnection) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      process.exit(0);
    }
  }
};

// Export để có thể import từ server.js
module.exports = { seedClasses };

// Chạy seed độc lập nếu file được chạy trực tiếp
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedClasses(true);
  })();
}

