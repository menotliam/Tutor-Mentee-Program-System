/**
 * Seed Teaching Subjects cho Instructors
 * Chạy file này để thêm môn học cho các instructor
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { connectDB } = require('../config/db');

// Kết nối MongoDB
const initConnection = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Danh sách môn học mẫu
const sampleSubjects = [
  {
    subjectCode: 'CS101',
    subjectName: 'Introduction to Computer Science',
    description: 'Nhập môn khoa học máy tính',
    level: 'beginner'
  },
  {
    subjectCode: 'MATH101',
    subjectName: 'Calculus I',
    description: 'Giải tích 1',
    level: 'beginner'
  },
  {
    subjectCode: 'CS201',
    subjectName: 'Data Structures',
    description: 'Cấu trúc dữ liệu',
    level: 'intermediate'
  },
  {
    subjectCode: 'CS202',
    subjectName: 'Algorithms',
    description: 'Thuật toán',
    level: 'intermediate'
  },
  {
    subjectCode: 'ENG101',
    subjectName: 'English Communication',
    description: 'Giao tiếp tiếng Anh',
    level: 'beginner'
  },
  {
    subjectCode: 'PHYS101',
    subjectName: 'Physics I',
    description: 'Vật lý đại cương',
    level: 'beginner'
  },
  {
    subjectCode: 'CS301',
    subjectName: 'Database Systems',
    description: 'Hệ quản trị cơ sở dữ liệu',
    level: 'intermediate'
  },
  {
    subjectCode: 'CS302',
    subjectName: 'Web Development',
    description: 'Phát triển ứng dụng web',
    level: 'intermediate'
  }
];

async function seedInstructors() {
  try {
    // Tìm tất cả instructors
    const instructors = await User.find({ role: 'instructor' });
    
    if (instructors.length === 0) {
      console.log('⚠️  Không tìm thấy instructor nào. Vui lòng tạo instructor trước.');
      return;
    }

    console.log(`📚 Tìm thấy ${instructors.length} instructor(s)`);

    for (const instructor of instructors) {
      // Nếu instructor chưa có teachingSubjects, thêm môn học mẫu
      if (!instructor.teachingSubjects || instructor.teachingSubjects.length === 0) {
        // Random 3-5 môn học cho mỗi instructor
        const numSubjects = Math.floor(Math.random() * 3) + 3;
        const shuffled = [...sampleSubjects].sort(() => 0.5 - Math.random());
        const selectedSubjects = shuffled.slice(0, numSubjects);
        
        instructor.teachingSubjects = selectedSubjects;
        
        // Thêm thông tin instructor khác nếu chưa có
        if (!instructor.yearsOfExperience) {
          instructor.yearsOfExperience = Math.floor(Math.random() * 10) + 1;
        }
        
        if (!instructor.degree) {
          const degrees = ['bachelor', 'master', 'phd'];
          instructor.degree = degrees[Math.floor(Math.random() * degrees.length)];
        }
        
        if (!instructor.bio) {
          instructor.bio = `Giảng viên có ${instructor.yearsOfExperience} năm kinh nghiệm giảng dạy.`;
        }
        
        await instructor.save();
        
        console.log(`✅ Updated instructor: ${instructor.username}`);
        console.log(`   Môn học: ${selectedSubjects.map(s => s.subjectCode).join(', ')}`);
      } else {
        console.log(`⏭️  Instructor ${instructor.username} đã có môn học rồi`);
      }
    }

    console.log('\n✅ Seed instructors hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Chạy seed
(async () => {
  await initConnection();
  await seedInstructors();
})();
