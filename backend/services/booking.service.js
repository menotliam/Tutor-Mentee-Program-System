const Class = require('../models/class.model');
const Booking = require('../models/booking.model');

const CONFIG = {
  CANCEL_LIMIT_HOURS: 3,
  REMINDER_HOURS: 1
};

class BookingService {
  // Helper: Tính giờ chênh lệch
  _getHoursDifference(targetTime) {
    const now = new Date();
    const target = new Date(targetTime);
    return (target - now) / (1000 * 60 * 60);
  }

  // Đặt lịch
  async bookSchedule(userId, classId) {
    console.log(`\n=== 🟢 BẮT ĐẦU ĐẶT LỊCH: ${userId} -> ${classId} ===`);
    
    const classInfo = await Class.findById(classId);
    if (!classInfo) throw new Error("Lớp học không tồn tại");

    // Validate thời hạn
    if (new Date() > classInfo.startTime) throw new Error("Quá hạn đăng ký");
    
    // Validate sỉ số
    if (classInfo.students.length >= classInfo.maxCapacity) throw new Error("Lớp đã đầy");
    
    // Validate lớp không bị hủy
    if (classInfo.isCancelled) throw new Error("Lớp học đã bị hủy");

    // Kiểm tra user đã đăng ký chưa
    const alreadyBooked = classInfo.students.some(
      studentId => studentId && userId && studentId.toString() === userId.toString()
    );
    if (alreadyBooked) throw new Error("Bạn đã đăng ký lớp này rồi");

    // Thêm sinh viên
    classInfo.students.push(userId);
    await classInfo.save();

    // Tạo booking record
    await Booking.create({
      userId,
      classId,
      tutorId: classInfo.tutorId,
      startTime: classInfo.startTime,
      status: 'ACTIVE'
    });

    // Gửi thông báo thành công
    await notificationService.sendToUser(userId, `Đặt lịch thành công cho lớp "${classInfo.name}"!`);
    
    // Lên lịch nhắc nhở
    schedulerService.scheduleReminder(classId, userId);

    console.log(`✅ Đặt lịch thành công!`);
    return { success: true, message: 'Đặt lịch thành công', classInfo };
  }

  // Hủy lịch
  async cancelSchedule(userId, classId) {
    console.log(`\n=== 🔴 BẮT ĐẦU HỦY LỊCH: ${userId} khỏi ${classId} ===`);
    
    const classInfo = await Class.findById(classId);
    if (!classInfo) throw new Error("Lớp học không tồn tại");
    
    // Validate thời hạn (trước 3 tiếng)
    if (this._getHoursDifference(classInfo.startTime) < CONFIG.CANCEL_LIMIT_HOURS) {
      throw new Error("Quá trễ để hủy lịch. Phải hủy trước ít nhất 3 giờ.");
    }

    // Kiểm tra user có trong lớp không
    const isInClass = classInfo.students.some(
      studentId => studentId && userId && studentId.toString() === userId.toString()
    );
    if (!isInClass) throw new Error("Bạn chưa đăng ký lớp này");

    // Xóa sinh viên khỏi lớp
    classInfo.students = classInfo.students.filter(
      id => id && userId && id.toString() !== userId.toString()
    );
    await classInfo.save();

    // Cập nhật booking
    await Booking.findOneAndUpdate(
      { userId, classId, status: 'ACTIVE' },
      { status: 'CANCELLED', cancelledAt: new Date() }
    );

    // Gửi thông báo
    await notificationService.sendToUser(userId, `Hủy lịch thành công cho lớp "${classInfo.name}"`);
    
    // Hủy reminder job của user này
    schedulerService.cancelUserReminders(classId, userId);
    
    // Lên lịch kiểm tra lớp có trống không
    schedulerService.scheduleClassCleanup(classId);

    console.log(`✅ Hủy lịch thành công!`);
    return { success: true, message: 'Hủy lịch thành công' };
  }

  // Đổi lịch
  async changeSchedule(userId, oldClassId, newClassId) {
    console.log(`\n=== 🟡 BẮT ĐẦU ĐỔI LỊCH: ${userId} từ ${oldClassId} sang ${newClassId} ===`);
    
    const oldClass = await Class.findById(oldClassId);
    const newClass = await Class.findById(newClassId);

    if (!oldClass) throw new Error("Lớp cũ không tồn tại");
    if (!newClass) throw new Error("Lớp mới không tồn tại");

    // Validate Lớp Mới
    if (newClass.students.length >= newClass.maxCapacity) {
      throw new Error("Lớp mới đã đầy");
    }
    if (newClass.isCancelled) {
      throw new Error("Lớp mới đã bị hủy");
    }

    // Validate Lớp Cũ - phải đổi trước 3 giờ
    if (this._getHoursDifference(oldClass.startTime) < CONFIG.CANCEL_LIMIT_HOURS) {
      throw new Error("Quá trễ để đổi lịch lớp cũ. Phải đổi trước ít nhất 3 giờ.");
    }

    // Kiểm tra user có trong lớp cũ không
    const isInOldClass = oldClass.students.some(
      studentId => studentId && userId && studentId.toString() === userId.toString()
    );
    if (!isInOldClass) throw new Error("Bạn chưa đăng ký lớp cũ");

    // Kiểm tra user đã có trong lớp mới chưa
    const alreadyInNewClass = newClass.students.some(
      studentId => studentId && userId && studentId.toString() === userId.toString()
    );
    if (alreadyInNewClass) throw new Error("Bạn đã đăng ký lớp mới rồi");

    // Transaction: Xóa cũ, thêm mới
    oldClass.students = oldClass.students.filter(
      id => id && userId && id.toString() !== userId.toString()
    );
    newClass.students.push(userId);

    await oldClass.save();
    await newClass.save();

    // Cập nhật booking - đánh dấu cũ là CANCELLED, tạo mới cho lớp mới
    await Booking.findOneAndUpdate(
      { userId, classId: oldClassId, status: 'ACTIVE' },
      { status: 'CANCELLED', cancelledAt: new Date() }
    );

    await Booking.create({
      userId,
      classId: newClassId,
      tutorId: newClass.tutorId,
      startTime: newClass.startTime,
      status: 'ACTIVE'
    });

    // Gửi thông báo
    await notificationService.sendToUser(
      userId,
      `Đổi lịch thành công! Từ lớp "${oldClass.name}" sang lớp "${newClass.name}"`
    );

    // Hủy reminder job của lớp cũ
    schedulerService.cancelUserReminders(oldClassId, userId);
    
    // Lên lịch reminder cho lớp mới
    schedulerService.scheduleReminder(newClassId, userId);
    
    // Lên lịch kiểm tra lớp cũ có trống không
    schedulerService.scheduleClassCleanup(oldClassId);

    console.log(`✅ Đổi lịch thành công!`);
    return { 
      success: true, 
      message: 'Đổi lịch thành công',
      oldClass: oldClass.name,
      newClass: newClass.name
    };
  }
}

module.exports = new BookingService();