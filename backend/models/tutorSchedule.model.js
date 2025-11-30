const mongoose = require('mongoose');

const tutorScheduleSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  
  timeSlots: [{
    type: String, // Format: "08-10", "10-12", "13-15", "15-17"
    required: true
  }],
  
  subjects: [{
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all'],
      default: 'all'
    }
  }],
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Danh sách students đã đăng ký cho từng timeSlot
  enrollments: [{
    timeSlot: {
      type: String,
      required: true
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    maxCapacity: {
      type: Number,
      default: 4,
      min: 1
    }
  }]
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index để đảm bảo không có lịch trùng
tutorScheduleSchema.index({ tutorId: 1, date: 1 }, { unique: true });
// Index cho query tìm schedules available
tutorScheduleSchema.index({ date: 1, isAvailable: 1 });
tutorScheduleSchema.index({ tutorId: 1, date: 1, isAvailable: 1 }); // Compound index cho getTutorSchedules

// Virtual field để lấy thông tin tutor
tutorScheduleSchema.virtual('tutor', {
  ref: 'User',
  localField: 'tutorId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('TutorSchedule', tutorScheduleSchema);
