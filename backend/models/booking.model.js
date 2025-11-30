const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorSchedule', required: true },
  timeSlot: { type: String, required: true }, // Format: "08-10", "10-12", etc.
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  subject: {
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'], 
    default: 'COMPLETED' // Tự động chấp nhận
  },
  cancelledAt: { type: Date },
  
  // Legacy fields (để tương thích với code cũ)
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  startTime: { type: Date },
  time: { type: String },
  tutorName: { type: String }
}, { timestamps: true });

// Index để tìm kiếm nhanh
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ tutorId: 1, status: 1 });
bookingSchema.index({ scheduleId: 1, timeSlot: 1 });
bookingSchema.index({ tutorId: 1, status: 1, date: 1 }); // Compound index cho getEnrolledStudentsGrouped
bookingSchema.index({ scheduleId: 1 }); // Index riêng cho scheduleId (dùng khi xóa)
bookingSchema.index({ createdAt: -1 }); // Index cho sort

module.exports = mongoose.model('Booking', bookingSchema);