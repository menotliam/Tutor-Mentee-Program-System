const Booking = require('../models/booking.model');
const Class = require('../models/class.model');
const TutorSchedule = require('../models/tutorSchedule.model');
const BookingService = require('../services/booking.service');

// Book schedule với TutorSchedule (mới)
const bookTutorSchedule = async (req, res) => {
  try {
    const { scheduleId, timeSlot, subject } = req.body;
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }
    
    if (!scheduleId || !timeSlot || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: scheduleId, timeSlot, subject'
      });
    }

    // Tìm schedule
    const schedule = await TutorSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch rảnh không tồn tại'
      });
    }

    // Kiểm tra timeSlot có trong schedule không
    if (!schedule.timeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không hợp lệ'
      });
    }

    // Kiểm tra subject có trong schedule không
    const validSubject = schedule.subjects.find(
      s => s.subjectCode.toUpperCase() === subject.subjectCode.toUpperCase()
    );
    if (!validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Môn học không hợp lệ'
      });
    }

    // Kiểm tra enrollment cho timeSlot này
    let enrollment = schedule.enrollments.find(e => e.timeSlot === timeSlot);
    
    if (!enrollment) {
      // Tạo enrollment mới nếu chưa có
      enrollment = {
        timeSlot,
        students: [],
        maxCapacity: 4
      };
      schedule.enrollments.push(enrollment);
    }

    // Kiểm tra đã đăng ký chưa
    const alreadyEnrolled = enrollment.students.some(
      studentId => studentId && userId && studentId.toString() === userId.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký khung giờ này rồi'
      });
    }

    // Kiểm tra còn chỗ không
    if (enrollment.students.length >= enrollment.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã đầy'
      });
    }

    // Validation: Kiểm tra thời gian booking
    // Parse date và timeSlot để tính giờ bắt đầu
    // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
    const [year, month, day] = schedule.date.split('-').map(Number);
    const [startHour] = timeSlot.split('-').map(Number);
    
    // Tạo Date object cho giờ bắt đầu buổi học
    const sessionStartTime = new Date(year, month - 1, day, startHour, 0, 0);
    
    const now = new Date();
    
    // Kiểm tra 1: Không cho book lịch trong quá khứ
    if (sessionStartTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt lịch cho buổi học đã qua'
      });
    }
    
    // Kiểm tra 2: Phải book trước giờ bắt đầu ít nhất 3 tiếng
    const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilStart < 3) {
      return res.status(400).json({
        success: false,
        message: 'Phải đặt lịch trước giờ bắt đầu ít nhất 3 tiếng'
      });
    }

    // Thêm student vào enrollment
    enrollment.students.push(userId);
    await schedule.save();

    // Tạo booking record với status ACTIVE (sẽ chuyển sang COMPLETED khi qua giờ)
    const booking = await Booking.create({
      userId,
      tutorId: schedule.tutorId,
      scheduleId: schedule._id,
      timeSlot,
      date: schedule.date,
      subject: {
        subjectCode: validSubject.subjectCode,
        subjectName: validSubject.subjectName
      },
      status: 'ACTIVE' // Bắt đầu với ACTIVE, sẽ chuyển sang COMPLETED khi qua giờ
    });

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công!',
      data: booking
    });
  } catch (error) {
    console.error('Book tutor schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Đặt lịch thất bại'
    });
  }
};

const bookSchedule = async (req, res) => {
  try {
    const { classId } = req.body;
    const userId = req.user.userId;
    
    // Sử dụng service thay vì direct Model
    const result = await BookingService.bookSchedule(userId, classId);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelSchedule = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId || req.user._id;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp bookingId'
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học'
      });
    }

    // Kiểm tra quyền sở hữu
    if (!booking.userId || !userId || booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy lịch này'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Lịch học đã bị hủy'
      });
    }
    // Xử lý hủy booking từ TutorSchedule
    if (booking.scheduleId) {
      const TutorSchedule = require('../models/tutorSchedule.model');
      const schedule = await TutorSchedule.findById(booking.scheduleId);
      
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Lịch rảnh không tồn tại'
        });
      }

      // Validation: Phải hủy trước giờ bắt đầu ít nhất 3 tiếng
      if (schedule.date && booking.timeSlot) {
        // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
        const [year, month, day] = schedule.date.split('-').map(Number);
        const [startHour] = booking.timeSlot.split('-').map(Number);
        const sessionStartTime = new Date(year, month - 1, day, startHour, 0, 0);
        
        const now = new Date();
        const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilStart < 3) {
          return res.status(400).json({
            success: false,
            message: 'Phải hủy lịch trước giờ bắt đầu ít nhất 3 tiếng'
          });
        }
      }
      
      // Tìm enrollment và xóa student khỏi danh sách
      const enrollment = schedule.enrollments.find(e => e.timeSlot === booking.timeSlot);
      if (enrollment) {
        enrollment.students = enrollment.students.filter(
          studentId => studentId && userId && studentId.toString() !== userId.toString()
        );
        await schedule.save();
      }
      
      // Cập nhật booking status
      booking.status = 'CANCELLED';
      booking.cancelledAt = new Date();
      await booking.save();
      
      return res.status(200).json({
        success: true,
        message: 'Hủy lịch thành công'
      });
    }

    // Xử lý hủy booking từ Class (legacy)
    if (booking.classId) {
      const result = await BookingService.cancelSchedule(userId, booking.classId);
      return res.status(200).json(result);
    }

    // Nếu không có cả scheduleId và classId
    return res.status(400).json({
      success: false,
      message: 'Không thể xác định loại booking để hủy'
    });
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Hủy lịch thất bại'
    });
  }
};

const changeSchedule = async (req, res) => {
  try {
    const { oldBookingId, newClassId, newScheduleId, newTimeSlot, newSubject } = req.body;
    const userId = req.user.userId || req.user._id;
    
    if (!oldBookingId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp oldBookingId'
      });
    }

    // Tìm booking cũ
    const oldBooking = await Booking.findById(oldBookingId);
    
    if (!oldBooking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học cũ'
      });
    }

    // Kiểm tra quyền sở hữu
    if (!oldBooking.userId || !userId || oldBooking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đổi lịch này'
      });
    }

    // Xử lý đổi lịch cho TutorSchedule (mới)
    if (oldBooking.scheduleId) {
      if (!newScheduleId || !newTimeSlot || !newSubject) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin: newScheduleId, newTimeSlot, newSubject'
        });
      }

      // Validation: Phải đổi trước giờ bắt đầu ít nhất 3 tiếng
      // Fetch oldSchedule một lần để dùng cho cả validation và xóa enrollment
      const oldSchedule = await TutorSchedule.findById(oldBooking.scheduleId);
      if (!oldSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Lịch rảnh cũ không tồn tại'
        });
      }

      if (oldSchedule.date && oldBooking.timeSlot) {
        // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
        const [year, month, day] = oldSchedule.date.split('-').map(Number);
        const [startHour] = oldBooking.timeSlot.split('-').map(Number);
        const sessionStartTime = new Date(year, month - 1, day, startHour, 0, 0);
        
        const now = new Date();
        const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilStart < 3) {
          return res.status(400).json({
            success: false,
            message: 'Phải đổi lịch trước giờ bắt đầu ít nhất 3 tiếng'
          });
        }
      }

      // Tìm schedule mới
      const newSchedule = await TutorSchedule.findById(newScheduleId);
      if (!newSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Lịch rảnh mới không tồn tại'
        });
      }

      // Kiểm tra timeSlot có trong schedule mới không
      if (!newSchedule.timeSlots.includes(newTimeSlot)) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ mới không hợp lệ'
        });
      }

      // Kiểm tra subject có trong schedule mới không
      const validSubject = newSchedule.subjects.find(
        s => s.subjectCode.toUpperCase() === newSubject.subjectCode.toUpperCase()
      );
      if (!validSubject) {
        return res.status(400).json({
          success: false,
          message: 'Môn học mới không hợp lệ'
        });
      }

      // Kiểm tra enrollment cho timeSlot mới
      let newEnrollment = newSchedule.enrollments.find(e => e.timeSlot === newTimeSlot);
      
      if (!newEnrollment) {
        newEnrollment = {
          timeSlot: newTimeSlot,
          students: [],
          maxCapacity: 4
        };
        newSchedule.enrollments.push(newEnrollment);
      }

      // Kiểm tra đã đăng ký chưa
      const alreadyEnrolled = newEnrollment.students.some(
        studentId => studentId && userId && studentId.toString() === userId.toString()
      );
      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khung giờ này rồi'
        });
      }

      // Kiểm tra còn chỗ không
      if (newEnrollment.students.length >= newEnrollment.maxCapacity) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ mới đã đầy'
        });
      }

      // Validation: Kiểm tra thời gian booking mới (không quá khứ và đủ 3 tiếng)
      // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
      const [newYear, newMonth, newDay] = newSchedule.date.split('-').map(Number);
      const [newStartHour] = newTimeSlot.split('-').map(Number);
      const newSessionStartTime = new Date(newYear, newMonth - 1, newDay, newStartHour, 0, 0);
      
      const now = new Date();
      
      if (newSessionStartTime < now) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đặt lịch mới cho buổi học đã qua'
        });
      }
      
      const hoursUntilNewStart = (newSessionStartTime - now) / (1000 * 60 * 60);
      if (hoursUntilNewStart < 3) {
        return res.status(400).json({
          success: false,
          message: 'Phải đặt lịch mới trước giờ bắt đầu ít nhất 3 tiếng'
        });
      }

      // Xóa student khỏi enrollment cũ (oldSchedule đã được fetch ở trên)
      const oldEnrollment = oldSchedule.enrollments.find(e => e.timeSlot === oldBooking.timeSlot);
      if (oldEnrollment) {
        oldEnrollment.students = oldEnrollment.students.filter(
          studentId => studentId && userId && studentId.toString() !== userId.toString()
        );
        await oldSchedule.save();
      }

      // Thêm student vào enrollment mới
      newEnrollment.students.push(userId);
      await newSchedule.save();

      // Cập nhật booking cũ thành CANCELLED
      oldBooking.status = 'CANCELLED';
      oldBooking.cancelledAt = new Date();
      await oldBooking.save();

      // Tạo booking mới với status ACTIVE
      const newBooking = await Booking.create({
        userId,
        tutorId: newSchedule.tutorId,
        scheduleId: newSchedule._id,
        timeSlot: newTimeSlot,
        date: newSchedule.date,
        subject: {
          subjectCode: validSubject.subjectCode,
          subjectName: validSubject.subjectName
        },
        status: 'ACTIVE'
      });

      return res.status(200).json({
        success: true,
        message: 'Đổi lịch thành công!',
        data: {
          oldBooking: oldBooking._id,
          newBooking: newBooking._id
        }
      });
    }

    // Xử lý đổi lịch cho Class (legacy)
    if (oldBooking.classId && newClassId) {
      const result = await BookingService.changeSchedule(
        userId, 
        oldBooking.classId, 
        newClassId
      );
      return res.status(200).json(result);
    }

    return res.status(400).json({
      success: false,
      message: 'Không thể xác định loại booking để đổi lịch'
    });
  } catch (error) {
    console.error('Change schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Đổi lịch thất bại'
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    // Lấy tất cả bookings của user với thông tin class, schedule và tutor
    // Sử dụng lean() để trả về plain objects thay vì Mongoose documents (nhanh hơn)
    const bookings = await Booking.find({ userId })
      .populate('scheduleId', 'date timeSlots subjects notes')
      .populate('tutorId', 'username fullName email')
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
      .limit(100) // Giới hạn số lượng để tránh query quá lớn
      .lean();

    // Tự động chuyển status từ ACTIVE sang COMPLETED cho các booking đã qua giờ
    const now = new Date();
    const bookingsToUpdate = [];
    
    for (const booking of bookings) {
      if (booking.status === 'ACTIVE' && booking.scheduleId && booking.date && booking.timeSlot) {
        // Tính giờ bắt đầu buổi học
        // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
        const [year, month, day] = booking.date.split('-').map(Number);
        const [startHour] = booking.timeSlot.split('-').map(Number);
        const sessionStartTime = new Date(year, month - 1, day, startHour, 0, 0);
        
        // Nếu giờ bắt đầu đã qua, chuyển sang COMPLETED
        if (sessionStartTime < now) {
          bookingsToUpdate.push(booking._id);
        }
      }
    }
    
    // Update status cho các bookings đã qua giờ
    if (bookingsToUpdate.length > 0) {
      await Booking.updateMany(
        { _id: { $in: bookingsToUpdate } },
        { $set: { status: 'COMPLETED' } }
      );
      
      // Cập nhật lại bookings trong memory để trả về đúng status
      bookings.forEach(b => {
        if (bookingsToUpdate.some(id => id.toString() === b._id.toString())) {
          b.status = 'COMPLETED';
        }
      });
    }

    // Transform data để frontend dễ dùng
    // Lọc bỏ các booking có scheduleId nhưng schedule đã bị xóa (null)
    const transformed = bookings
      .filter(b => {
        // Nếu có scheduleId nhưng schedule là null (đã bị xóa), bỏ qua
        if (b.scheduleId === null || (typeof b.scheduleId === 'object' && !b.scheduleId._id)) {
          return false;
        }
        return true;
      })
      .map(b => {
      // Xử lý cho booking từ TutorSchedule (có scheduleId)
      if (b.scheduleId) {
        // Format timeSlot từ "08-10" thành "08:00 - 10:00"
        let timeSlotLabel = 'N/A';
        if (b.timeSlot) {
          if (b.timeSlot.includes(':')) {
            timeSlotLabel = b.timeSlot;
          } else {
            // Format: "08-10" -> "08:00 - 10:00"
            const parts = b.timeSlot.split('-');
            if (parts.length === 2) {
              timeSlotLabel = `${parts[0]}:00 - ${parts[1]}:00`;
            } else {
              timeSlotLabel = b.timeSlot;
            }
          }
        }
        
        // Tạo startTime từ date và timeSlot để tương thích với frontend
        let startTime = null;
        if (b.date && b.timeSlot) {
          const [startHour] = b.timeSlot.split('-');
          const hour = parseInt(startHour.replace(':', ''));
          // Parse date string "YYYY-MM-DD" correctly (treat as local date, not UTC)
          const [year, month, day] = b.date.split('-').map(Number);
          startTime = new Date(year, month - 1, day, hour, 0, 0);
        }

        return {
          _id: b._id,
          scheduleId: b.scheduleId?._id,
          tutorName: b.tutorId?.fullName || b.tutorId?.username || b.tutorName || 'N/A',
          tutorEmail: b.tutorId?.email,
          startTime: startTime || b.startTime,
          date: b.date || b.scheduleId?.date,
          time: timeSlotLabel,
          timeSlot: b.timeSlot,
          status: b.status,
          subject: b.subject?.subjectName || b.subject?.subjectCode || 'N/A',
          subjectCode: b.subject?.subjectCode,
          createdAt: b.createdAt,
          cancelledAt: b.cancelledAt,
          isTutorSchedule: true // Đánh dấu là booking từ TutorSchedule
        };
      }
      
      // Xử lý cho booking từ Class (có classId) - legacy
      return {
        _id: b._id,
        classId: b.classId?._id,
        className: b.classId?.name || b.subject || 'N/A',
        tutorName: b.tutorId?.fullName || b.tutorId?.username || b.tutorName || 'N/A',
        tutorEmail: b.tutorId?.email,
        startTime: b.startTime || b.classId?.startTime,
        date: b.date,
        time: b.time,
        status: b.status,
        subject: b.subject,
        createdAt: b.createdAt,
        cancelledAt: b.cancelledAt,
        isTutorSchedule: false
      };
    });

    res.status(200).json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lấy danh sách lịch thất bại'
    });
  }
};

const getAvailableClasses = async (req, res) => {
  try {
    const now = new Date();
    
    const classes = await Class.find({
      startTime: { $gt: now }, // Chưa bắt đầu
      isCancelled: false,       // Chưa bị hủy
      $expr: { $lt: [{ $size: "$students" }, "$maxCapacity"] } // Còn chỗ
    })
      .populate('tutorId', 'username email')
      .sort({ startTime: 1 }) // Sắp xếp theo thời gian
      .lean();

    // Transform data để frontend dễ dùng
    const transformed = classes.map(cls => ({
      _id: cls._id,
      name: cls.name,
      tutorName: cls.tutorId?.username || 'Unknown',
      tutorEmail: cls.tutorId?.email,
      startTime: cls.startTime,
      date: new Date(cls.startTime).toLocaleDateString('vi-VN'),
      time: new Date(cls.startTime).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      availableSlots: cls.maxCapacity - cls.students.length,
      maxCapacity: cls.maxCapacity,
      enrolledCount: cls.students.length
    }));

    res.status(200).json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Get available classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lấy danh sách lớp thất bại'
    });
  }
};

// QUAN TRỌNG: Phải export tất cả functions
module.exports = {
  bookSchedule,
  bookTutorSchedule,
  cancelSchedule,
  changeSchedule,
  getBookings,
  getAvailableClasses
};