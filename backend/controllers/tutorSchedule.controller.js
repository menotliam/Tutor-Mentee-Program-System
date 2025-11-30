const TutorSchedule = require('../models/tutorSchedule.model');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');

/**
 * TutorScheduleController
 * Xử lý logic cho lịch rảnh của tutor
 */
class TutorScheduleController {
  
  /**
   * Helper method: Get user ID from req.user (support both _id and userId)
   */
  static getUserId(req) {
    return req.user._id || req.user.userId;
  }
  
  /**
   * @desc    Tạo/Cập nhật lịch rảnh cho tutor
   * @route   POST /api/tutor/schedule
   * @access  Private (Instructor only)
   */
  static async createOrUpdateSchedule(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { schedules, updates } = req.body; 
      // schedules: Array of { date, timeSlots, subjects, notes } - schedules mới
      // updates: Array of { scheduleId, date, timeSlots, subjects, notes } - schedules cần cập nhật
      
      const hasNewSchedules = schedules && Array.isArray(schedules) && schedules.length > 0;
      const hasUpdates = updates && Array.isArray(updates) && updates.length > 0;
      
      if (!hasNewSchedules && !hasUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp danh sách lịch rảnh mới hoặc cập nhật'
        });
      }
      
      // Lấy thông tin instructor để kiểm tra teachingSubjects
      const instructor = await User.findById(tutorId).select('teachingSubjects');
      
      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin instructor'
        });
      }
      
      // Lấy danh sách subject codes mà instructor có thể dạy
      const allowedSubjectCodes = instructor.teachingSubjects.map(s => s.subjectCode.toUpperCase());
      
      const results = [];
      const errors = [];
      
      // Helper function để validate và process schedule
      const processSchedule = async (scheduleData, isUpdate = false, processedSchedules = []) => {
        const { date, timeSlots, subjects, notes, scheduleId, maxCapacity } = scheduleData;
        
        // Validation cơ bản
        if (!date || !timeSlots || timeSlots.length === 0) {
          return { error: { date, error: 'Ngày và khung giờ là bắt buộc' } };
        }
        
        if (!subjects || subjects.length === 0) {
          return { error: { date, error: 'Vui lòng chọn ít nhất một môn học' } };
        }
        
        // Validation: Chỉ cho phép tạo lịch từ ngày tiếp theo (không cho ngày hôm nay)
        const scheduleDate = new Date(date);
        scheduleDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (scheduleDate <= today) {
          return { error: { date, error: 'Chỉ có thể tạo lịch rảnh từ ngày tiếp theo' } };
        }
        
        // Kiểm tra xem các môn học có nằm trong danh sách teachingSubjects không
        const invalidSubjects = [];
        const validatedSubjects = [];
        
        for (const subject of subjects) {
          const subjectCode = subject.subjectCode.toUpperCase();
          if (!allowedSubjectCodes.includes(subjectCode)) {
            invalidSubjects.push(subject.subjectName || subjectCode);
          } else {
            const fullSubject = instructor.teachingSubjects.find(
              s => s.subjectCode.toUpperCase() === subjectCode
            );
            
            if (fullSubject) {
              validatedSubjects.push(fullSubject.toObject ? fullSubject.toObject() : fullSubject);
            } else {
              validatedSubjects.push({
                subjectCode: subject.subjectCode.toUpperCase(),
                subjectName: subject.subjectName,
                description: subject.description || '',
                level: subject.level || 'all'
              });
            }
          }
        }
        
        if (invalidSubjects.length > 0) {
          return { 
            error: { 
              date, 
              error: `Bạn không có quyền dạy các môn: ${invalidSubjects.join(', ')}. Vui lòng cập nhật danh sách môn học trong profile trước.`
            } 
          };
        }
        
        // Validate: chỉ cho phép 1 môn học
        if (validatedSubjects.length !== 1) {
          return { 
            error: { 
              date, 
              error: 'Chỉ được chọn một môn học cho mỗi lần cập nhật'
            } 
          };
        }
        
        // Kiểm tra xem các timeSlots đã được sử dụng trong ngày đó chưa
        // Chỉ select field cần thiết và dùng lean() để tối ưu
        const existingSchedules = await TutorSchedule.find({
          tutorId,
          date
        })
        .select('timeSlots') // Chỉ select field cần thiết
        .lean();
        
        const usedTimeSlots = new Set();
        
        // Thêm timeSlots từ database
        existingSchedules.forEach(sched => {
          // Nếu là update, bỏ qua schedule hiện tại
          if (isUpdate && scheduleId && sched._id.toString() === scheduleId.toString()) {
            return;
          }
          if (sched.timeSlots && Array.isArray(sched.timeSlots)) {
            sched.timeSlots.forEach(slot => usedTimeSlots.add(slot));
          }
        });
        
        // Thêm timeSlots từ các schedules đã được xử lý thành công trong cùng request
        processedSchedules.forEach(sched => {
          // Chỉ kiểm tra schedules cùng ngày
          if (sched.date === date && sched.timeSlots && Array.isArray(sched.timeSlots)) {
            sched.timeSlots.forEach(slot => usedTimeSlots.add(slot));
          }
        });
        
        // Kiểm tra xem có timeSlot nào trùng không
        const conflictingSlots = timeSlots.filter(slot => usedTimeSlots.has(slot));
        if (conflictingSlots.length > 0) {
          return { 
            error: { 
              date, 
              error: `Các khung giờ ${conflictingSlots.join(', ')} đã được sử dụng trong ngày này. Vui lòng chọn khung giờ khác.`
            } 
          };
        }
        
        return { 
          data: {
            date,
            timeSlots,
            subjects: validatedSubjects,
            notes: notes || '',
            scheduleId,
            maxCapacity: maxCapacity || 4 // Mặc định là 4 nếu không có
          }
        };
      };
      
      // Xử lý schedules mới
      // Track các schedules đã được xử lý thành công để tránh conflict trong cùng request
      const processedSchedulesInRequest = [];
      
      if (hasNewSchedules) {
        for (const schedule of schedules) {
          const result = await processSchedule(schedule, false, processedSchedulesInRequest);
          
          if (result.error) {
            errors.push(result.error);
            continue;
          }
          
          try {
            // Khởi tạo enrollments cho mỗi timeSlot với maxCapacity mặc định
            const enrollments = result.data.timeSlots.map(timeSlot => ({
              timeSlot,
              students: [],
              maxCapacity: result.data.maxCapacity || 4 // Lấy từ request hoặc mặc định là 4
            }));
            
            const newSchedule = new TutorSchedule({
              tutorId, 
              date: result.data.date, 
              timeSlots: result.data.timeSlots,
              subjects: result.data.subjects,
              notes: result.data.notes,
              isAvailable: true,
              enrollments: enrollments
            });
            
            await newSchedule.save();
            results.push(newSchedule);
            
            // Thêm vào danh sách processed để kiểm tra các schedules tiếp theo
            processedSchedulesInRequest.push({
              date: result.data.date,
              timeSlots: result.data.timeSlots
            });
          } catch (error) {
            errors.push({ date: result.data.date, error: error.message });
          }
        }
      }
      
      // Xử lý updates
      if (hasUpdates) {
        for (const update of updates) {
          const { scheduleId } = update;
          
          // Kiểm tra schedule có tồn tại và thuộc về tutor này không
          const existingSchedule = await TutorSchedule.findOne({
            _id: scheduleId,
            tutorId
          });
          
          if (!existingSchedule) {
            errors.push({ 
              date: update.date || 'Unknown', 
              error: 'Không tìm thấy lịch rảnh để cập nhật hoặc bạn không có quyền cập nhật'
            });
            continue;
          }
          
          const result = await processSchedule(update, true);
          
          if (result.error) {
            errors.push(result.error);
            continue;
          }
          
          try {
            // Cập nhật enrollments khi timeSlots thay đổi
            const newTimeSlots = result.data.timeSlots;
            const oldTimeSlots = existingSchedule.timeSlots || [];
            const existingEnrollments = existingSchedule.enrollments || [];
            
            // Tạo map của enrollments hiện có theo timeSlot
            const enrollmentMap = new Map();
            existingEnrollments.forEach(enrollment => {
              enrollmentMap.set(enrollment.timeSlot, enrollment);
            });
            
            // Tạo enrollments mới: giữ lại enrollments cũ cho timeSlot vẫn còn, tạo mới cho timeSlot mới
            const updatedEnrollments = newTimeSlots.map(timeSlot => {
              const existingEnrollment = enrollmentMap.get(timeSlot);
              if (existingEnrollment) {
                // Giữ lại enrollment cũ (bao gồm students đã đăng ký)
                return existingEnrollment;
              } else {
                // Tạo enrollment mới cho timeSlot mới
                return {
                  timeSlot,
                  students: [],
                  maxCapacity: result.data.maxCapacity || 4
                };
              }
            });
            
            existingSchedule.timeSlots = result.data.timeSlots;
            existingSchedule.subjects = result.data.subjects;
            existingSchedule.notes = result.data.notes;
            existingSchedule.enrollments = updatedEnrollments;
            
            await existingSchedule.save();
            results.push(existingSchedule);
          } catch (error) {
            errors.push({ date: result.data.date, error: error.message });
          }
        }
      }
      
      const createdCount = hasNewSchedules ? schedules.length : 0;
      const updatedCount = hasUpdates ? updates.length : 0;
      const successCount = results.length;
      
      let message = '';
      if (createdCount > 0 && updatedCount > 0) {
        message = `Đã tạo ${createdCount} và cập nhật ${updatedCount} lịch rảnh`;
      } else if (createdCount > 0) {
        message = `Đã tạo ${successCount} lịch rảnh mới`;
      } else if (updatedCount > 0) {
        message = `Đã cập nhật ${successCount} lịch rảnh`;
      }
      
      res.status(200).json({
        success: true,
        message,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      console.error('Error in createOrUpdateSchedule:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu lịch rảnh',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Lấy lịch rảnh của tutor hiện tại
   * @route   GET /api/tutor/schedule
   * @access  Private (Instructor only)
   */
  static async getMySchedules(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { startDate, endDate } = req.query;
      
      const query = { tutorId };
      
      // Nếu có filter theo ngày
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }
      
      const schedules = await TutorSchedule.find(query).sort({ date: 1 });
      
      res.status(200).json({
        success: true,
        count: schedules.length,
        data: schedules
      });
      
    } catch (error) {
      console.error('Error in getMySchedules:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch rảnh',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Xóa một lịch rảnh
   * @route   DELETE /api/tutor/schedule/:scheduleId
   * @access  Private (Instructor only)
   */
  static async deleteSchedule(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { scheduleId } = req.params;
      
      const schedule = await TutorSchedule.findOne({ 
        _id: scheduleId, 
        tutorId 
      });
      
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch rảnh'
        });
      }
      
      // Xóa tất cả các booking liên quan đến schedule này
      const deleteResult = await Booking.deleteMany({
        scheduleId: scheduleId
      });
      
      console.log(`Đã xóa ${deleteResult.deletedCount} booking liên quan đến schedule ${scheduleId}`);
      
      // Xóa schedule
      await TutorSchedule.deleteOne({ _id: scheduleId });
      
      res.status(200).json({
        success: true,
        message: 'Đã xóa lịch rảnh thành công',
        deletedBookings: deleteResult.deletedCount
      });
      
    } catch (error) {
      console.error('Error in deleteSchedule:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa lịch rảnh',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Xóa lịch rảnh theo ngày
   * @route   DELETE /api/tutor/schedule/date/:date
   * @access  Private (Instructor only)
   */
  static async deleteScheduleByDate(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { date } = req.params;
      
      const schedule = await TutorSchedule.findOne({ tutorId, date });
      
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch rảnh cho ngày này'
        });
      }
      
      // Xóa tất cả các booking liên quan đến schedule này
      const deleteResult = await Booking.deleteMany({
        scheduleId: schedule._id
      });
      
      console.log(`Đã xóa ${deleteResult.deletedCount} booking liên quan đến schedule ${schedule._id} (ngày ${date})`);
      
      // Xóa schedule
      await TutorSchedule.deleteOne({ tutorId, date });
      
      res.status(200).json({
        success: true,
        message: 'Đã xóa lịch rảnh thành công',
        deletedBookings: deleteResult.deletedCount
      });
      
    } catch (error) {
      console.error('Error in deleteScheduleByDate:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa lịch rảnh',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Lấy danh sách booking của tutor
   * @route   GET /api/tutor/bookings
   * @access  Private (Instructor only)
   */
  static async getMyBookings(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { status, startDate, endDate } = req.query;
      
      const query = { tutorId };
      
      if (status) {
        query.status = status.toUpperCase();
      }
      
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      
      const bookings = await Booking.find(query)
        .populate('userId', 'username email fullName phoneNumber avatar')
        .populate('classId', 'name subject')
        .sort({ startTime: -1 });
      
      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });
      
    } catch (error) {
      console.error('Error in getMyBookings:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách booking',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Cập nhật trạng thái booking (hoàn thành, hủy)
   * @route   PATCH /api/tutor/bookings/:bookingId
   * @access  Private (Instructor only)
   */
  static async updateBookingStatus(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { bookingId } = req.params;
      const { status } = req.body;
      
      if (!['COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }
      
      const booking = await Booking.findOne({ 
        _id: bookingId, 
        tutorId 
      });
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }
      
      booking.status = status;
      if (status === 'CANCELLED') {
        booking.cancelledAt = new Date();
      }
      
      await booking.save();
      
      res.status(200).json({
        success: true,
        message: `Đã ${status === 'COMPLETED' ? 'hoàn thành' : 'hủy'} booking`,
        data: booking
      });
      
    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật booking',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Lấy thông tin profile của tutor
   * @route   GET /api/tutor/profile
   * @access  Private (Instructor only)
   */
  static async getProfile(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      
      const tutor = await User.findById(tutorId).select('-password -refreshTokens');
      
      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tutor'
        });
      }
      
      // Đếm số booking
      const totalBookings = await Booking.countDocuments({ tutorId });
      const activeBookings = await Booking.countDocuments({ 
        tutorId, 
        status: 'ACTIVE' 
      });
      const completedBookings = await Booking.countDocuments({ 
        tutorId, 
        status: 'COMPLETED' 
      });
      
      // Đếm số lịch rảnh
      const totalSchedules = await TutorSchedule.countDocuments({ tutorId });
      
      res.status(200).json({
        success: true,
        data: {
          ...tutor.toJSON(),
          stats: {
            totalBookings,
            activeBookings,
            completedBookings,
            totalSchedules
          }
        }
      });
      
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin profile',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Lấy danh sách môn học mà tutor có thể dạy
   * @route   GET /api/tutor/teaching-subjects
   * @access  Private (Instructor only)
   */
  static async getTeachingSubjects(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      console.log('🔍 [getTeachingSubjects] TutorId:', tutorId);
      
      const tutor = await User.findById(tutorId).select('teachingSubjects username email role');
      console.log('📚 [getTeachingSubjects] Found tutor:', {
        username: tutor?.username,
        email: tutor?.email,
        role: tutor?.role,
        teachingSubjectsCount: tutor?.teachingSubjects?.length || 0
      });
      
      if (!tutor) {
        console.log('❌ [getTeachingSubjects] Tutor not found');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tutor'
        });
      }
      
      const subjects = tutor.teachingSubjects || [];
      console.log('✅ [getTeachingSubjects] Returning', subjects.length, 'subjects');
      
      res.status(200).json({
        success: true,
        data: subjects
      });
      
    } catch (error) {
      console.error('❌ [getTeachingSubjects] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách môn học',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Cập nhật thông tin profile của tutor
   * @route   PATCH /api/tutor/profile
   * @access  Private (Instructor only)
   */
  static async updateProfile(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      const { 
        fullName, 
        phoneNumber, 
        avatar, 
        subjects, 
        teachingSubjects,
        yearsOfExperience,
        degree,
        specialization,
        bio
      } = req.body;
      
      
      
      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (avatar) updateData.avatar = avatar;
      if (subjects) updateData.subjects = subjects;
      if (teachingSubjects) updateData.teachingSubjects = teachingSubjects;
      if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
      if (degree !== undefined) updateData.degree = degree;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (bio !== undefined) {
        updateData.bio = bio.trim(); // Trim bio trước khi lưu
      }
      
      
      
      const tutor = await User.findByIdAndUpdate(
        tutorId,
        { $set: updateData }, // Sử dụng $set để đảm bảo update đúng
        { new: true, runValidators: true, strict: false } // strict: false để cho phép update các field không có trong schema (nếu cần)
      ).select('-password -refreshTokens');
      
      
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: tutor
      });
      
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy danh sách buổi học (classes) của tutor với số lượng sinh viên
   * @route   GET /api/tutor/classes
   * @access  Private (Instructor only)
   */
  static async getMyClasses(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      
      // Lấy tất cả schedules của tutor có enrollments
      const schedules = await TutorSchedule.find({
        tutorId,
        isAvailable: true
      })
      .sort({ date: 1 });
      
      // Format dữ liệu: chỉ hiển thị thông tin buổi học
      const classes = [];
      
      schedules.forEach(schedule => {
        if (schedule.enrollments && schedule.enrollments.length > 0) {
          schedule.enrollments.forEach(enrollment => {
            if (enrollment.students && enrollment.students.length > 0) {
              classes.push({
                scheduleId: schedule._id,
                date: schedule.date,
                timeSlot: enrollment.timeSlot,
                subjects: schedule.subjects,
                studentCount: enrollment.students.length,
                maxCapacity: enrollment.maxCapacity || 4,
                notes: schedule.notes
              });
            }
          });
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách buổi học thành công',
        data: classes,
        total: classes.length
      });
      
    } catch (error) {
      console.error('Error in getMyClasses:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách buổi học',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy danh sách sinh viên đã đăng ký lịch học với tutor
   * @route   GET /api/tutor/enrolled-students
   * @access  Private (Instructor only)
   */
  static async getEnrolledStudents(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      
      // Lấy tất cả bookings ACTIVE của tutor
      const bookings = await Booking.find({
        tutorId,
        status: 'ACTIVE'
      })
      .populate('userId', 'username email fullName phoneNumber')
      .populate('scheduleId')
      .sort({ date: 1, timeSlot: 1 });
      
      // Format dữ liệu cho frontend
      const enrolledStudents = bookings.map(booking => ({
        bookingId: booking._id,
        student: {
          id: booking.userId._id,
          name: booking.userId.fullName || booking.userId.username,
          email: booking.userId.email,
          phone: booking.userId.phoneNumber
        },
        date: booking.date,
        timeSlot: booking.timeSlot,
        subjects: booking.subjects,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt
      }));
      
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách sinh viên thành công',
        data: enrolledStudents,
        total: enrolledStudents.length
      });
      
    } catch (error) {
      console.error('Error in getEnrolledStudents:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sinh viên',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy danh sách sinh viên đã đăng ký, nhóm theo buổi học (cho tab "Danh sách sinh viên")
   * @route   GET /api/tutors/enrolled-students-grouped
   * @access  Private (Instructor only)
   */
  static async getEnrolledStudentsGrouped(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      
      // Lấy tất cả bookings COMPLETED của tutor
      // Sử dụng lean() và chỉ populate field cần thiết
      const bookings = await Booking.find({
        tutorId,
        status: 'ACTIVE'
      })
      .populate('userId', 'username email fullName phoneNumber studentId')
      .select('userId date timeSlot subject') // Chỉ select field cần thiết
      .sort({ date: 1, timeSlot: 1 })
      .lean();
      
      // Nhóm theo buổi học (date + timeSlot + subject)
      const groupedBySession = {};
      
      bookings.forEach(booking => {
        const sessionKey = `${booking.date}-${booking.timeSlot}-${booking.subject?.subjectCode || 'unknown'}`;
        
        if (!groupedBySession[sessionKey]) {
          groupedBySession[sessionKey] = {
            date: booking.date,
            timeSlot: booking.timeSlot,
            subject: booking.subject,
            students: []
          };
        }
        
        if (booking.userId) {
          groupedBySession[sessionKey].students.push({
            id: booking.userId._id,
            name: booking.userId.fullName || booking.userId.username,
            email: booking.userId.email,
            phone: booking.userId.phoneNumber,
            studentId: booking.userId.studentId,
            bookingId: booking._id
          });
        }
      });
      
      // Convert sang array và format
      const result = Object.values(groupedBySession).map(session => ({
        date: session.date,
        timeSlot: session.timeSlot,
        subject: session.subject,
        students: session.students,
        studentCount: session.students.length
      }));
      
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách sinh viên thành công',
        data: result,
        total: result.length
      });
      
    } catch (error) {
      console.error('Error in getEnrolledStudentsGrouped:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sinh viên',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy danh sách buổi học có ít nhất 1 sinh viên đăng ký (cho tab "Danh sách buổi học")
   * @route   GET /api/tutors/classes-with-students
   * @access  Private (Instructor only)
   */
  static async getClassesWithStudents(req, res) {
    try {
      const tutorId = TutorScheduleController.getUserId(req);
      
      // Lấy tất cả bookings COMPLETED của tutor
      // Sử dụng lean() và chỉ populate field cần thiết
      const bookings = await Booking.find({
        tutorId,
        status: 'ACTIVE'
      })
      .populate('userId', 'username email fullName')
      .select('userId date timeSlot subject') // Chỉ select field cần thiết
      .sort({ date: 1, timeSlot: 1 })
      .lean();
      
      // Nhóm theo buổi học (date + timeSlot + subject)
      const groupedBySession = {};
      
      bookings.forEach(booking => {
        const sessionKey = `${booking.date}-${booking.timeSlot}-${booking.subject?.subjectCode || 'unknown'}`;
        
        if (!groupedBySession[sessionKey]) {
          groupedBySession[sessionKey] = {
            date: booking.date,
            timeSlot: booking.timeSlot,
            subject: booking.subject,
            students: []
          };
        }
        
        if (booking.userId) {
          groupedBySession[sessionKey].students.push({
            id: booking.userId._id,
            name: booking.userId.fullName || booking.userId.username,
            email: booking.userId.email
          });
        }
      });
      
      // Convert sang array và format (chỉ lấy những buổi có ít nhất 1 sinh viên)
      const result = Object.values(groupedBySession)
        .filter(session => session.students.length > 0)
        .map(session => ({
          date: session.date,
          timeSlot: session.timeSlot,
          subject: session.subject,
          studentCount: session.students.length,
          students: session.students.map(s => s.name).join(", ")
        }));
      
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách buổi học thành công',
        data: result,
        total: result.length
      });
      
    } catch (error) {
      console.error('Error in getClassesWithStudents:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách buổi học',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy danh sách tutor có lịch rảnh (cho sinh viên chọn)
   * @route   GET /api/schedules/available-tutors
   * @access  Public (hoặc Private)
   */
  static async getAvailableTutors(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Lấy tất cả schedules có isAvailable = true và date >= today
      // Sử dụng lean() và chỉ populate field cần thiết
      const schedules = await TutorSchedule.find({
        date: { $gte: today },
        isAvailable: true
      })
      .populate('tutorId', 'username email fullName avatar teachingSubjects')
      .select('tutorId date timeSlots subjects')
      .limit(500) // Giới hạn số lượng để tránh query quá lớn
      .lean();

      // Lọc các schedule có tutorId hợp lệ
      const validSchedules = schedules.filter(s => s.tutorId && s.tutorId._id);

      // Nhóm theo tutorId và lấy thông tin tutor
      const tutorMap = new Map();
      
      validSchedules.forEach(schedule => {
        const tutorId = schedule.tutorId._id.toString();
        
        if (!tutorMap.has(tutorId)) {
          tutorMap.set(tutorId, {
            tutorId: schedule.tutorId._id,
            tutorName: schedule.tutorId.fullName || schedule.tutorId.username,
            tutorEmail: schedule.tutorId.email,
            tutorAvatar: schedule.tutorId.avatar,
            availableDates: [],
            subjects: schedule.tutorId.teachingSubjects || []
          });
        }
        
        const tutor = tutorMap.get(tutorId);
        if (!tutor.availableDates.includes(schedule.date)) {
          tutor.availableDates.push(schedule.date);
        }
      });

      const tutors = Array.from(tutorMap.values()).map(tutor => ({
        ...tutor,
        availableDates: tutor.availableDates.sort(),
        availableDatesCount: tutor.availableDates.length
      }));

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách tutor thành công',
        data: tutors,
        total: tutors.length
      });
    } catch (error) {
      console.error('Error in getAvailableTutors:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tutor',
        error: error.message
      });
    }
  }

  /**
   * @desc    Lấy lịch rảnh của một tutor cụ thể (cho sinh viên xem và đăng ký)
   * @route   GET /api/schedules/tutor/:tutorId
   * @access  Public (hoặc Private)
   */
  static async getTutorSchedules(req, res) {
    try {
      const { tutorId } = req.params;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Lấy tất cả schedules của tutor có isAvailable = true và date >= today
      // Sử dụng lean() và chỉ populate field cần thiết
      const schedules = await TutorSchedule.find({
        tutorId,
        date: { $gte: today },
        isAvailable: true
      })
      .populate('tutorId', 'username email fullName avatar')
      .select('date timeSlots subjects enrollments notes tutorId') // Chỉ select field cần thiết
      .sort({ date: 1 })
      .limit(100) // Giới hạn số lượng
      .lean();

      // Format dữ liệu cho frontend
      const formattedSchedules = schedules.map(schedule => {
        // Lấy thông tin enrollment cho mỗi timeSlot
        const timeSlotsWithAvailability = schedule.timeSlots.map(timeSlot => {
          const enrollment = schedule.enrollments?.find(e => e.timeSlot === timeSlot);
          const enrolledCount = enrollment?.students?.length || 0;
          const maxCapacity = enrollment?.maxCapacity || 4;
          const availableSlots = maxCapacity - enrolledCount;

          return {
            timeSlot,
            enrolledCount,
            maxCapacity,
            availableSlots,
            isFull: availableSlots <= 0
          };
        });

        return {
          scheduleId: schedule._id,
          date: schedule.date,
          tutorName: schedule.tutorId.fullName || schedule.tutorId.username,
          tutorEmail: schedule.tutorId.email,
          tutorAvatar: schedule.tutorId.avatar,
          subjects: schedule.subjects,
          timeSlots: timeSlotsWithAvailability,
          notes: schedule.notes
        };
      });

      res.status(200).json({
        success: true,
        message: 'Lấy lịch rảnh của tutor thành công',
        data: formattedSchedules,
        total: formattedSchedules.length
      });
    } catch (error) {
      console.error('Error in getTutorSchedules:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch rảnh của tutor',
        error: error.message
      });
    }
  }
}

module.exports = TutorScheduleController;
