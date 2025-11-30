// /models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username là bắt buộc'],
    unique: true,
    trim: true,
    minlength: [3, 'Username phải có ít nhất 3 ký tự'],
    maxlength: [50, 'Username không được quá 50 ký tự']
  },
  
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  
  password: {
    type: String,
    required: [true, 'Password là bắt buộc'],
    minlength: [6, 'Password phải có ít nhất 6 ký tự'],
    select: false // Không trả về password khi query (bảo mật)
  },
  
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student', 'pending_instructor'],
    default: 'student'
  },
  
  // Alias cho status (để frontend có thể dùng cả 2)
  status: {
    type: String,
    get: function() {
      return this.role; // status và role là một
    },
    set: function(value) {
      this.role = value;
    }
  },
  
  // Thông tin cá nhân
  fullName: {
    type: String,
    trim: true
  },
  
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    default: null
  },
  
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  
  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },
  
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  
  lastPasswordResetRequest: {
    type: Date,
    default: null
  },
  
  // Login attempts & account security
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  },
  
  // Refresh tokens (cho phép nhiều thiết bị đăng nhập)
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    deviceInfo: String // Browser, OS, IP
  }],
  
  // Thời gian đăng nhập lần cuối
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  lastLoginIP: {
    type: String,
    default: null
  },
  
  // Trạng thái tài khoản
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  // ============ STUDENT-SPECIFIC FIELDS ============
  studentId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Chỉ unique khi có giá trị (không bắt buộc cho non-student)
    match: [/^[0-9]{7,10}$/, 'Student ID không hợp lệ']
  },
  
  GPA: {
    type: Number,
    min: [0, 'GPA không thể nhỏ hơn 0'],
    max: [4.0, 'GPA không thể lớn hơn 4.0'],
    default: null
  },
  
  major: {
    type: String,
    trim: true,
    default: null
  },
  
  academicYear: {
    type: String,
    trim: true,
    default: null
  },
  
  conductScore: {
    type: Number,
    min: [0, 'Conduct score không thể nhỏ hơn 0'],
    max: [100, 'Conduct score không thể lớn hơn 100'],
    default: null
  },
  
  // Khoa (Faculty)
  faculty: {
    type: String,
    trim: true,
    default: null
  },
  
  // Danh sách môn học và điểm số
  subjects: {
    type: [{
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
      grade: {
        type: Number,
        required: true,
        min: [0, 'Điểm không thể nhỏ hơn 0'],
        max: [10, 'Điểm không thể lớn hơn 10']
      }
    }],
    default: []
  },
  teachingSubjects: [{
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
      default: ''
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all'],
      default: 'all'
    }
  }],

  // ============ INSTRUCTOR-SPECIFIC FIELDS ============
  // Bằng cấp
  degree: {
    type: String,
    trim: true,
    default: null
  },

  // Chuyên ngành
  specialization: {
    type: String,
    trim: true,
    default: null
  },

  // Tiểu sử
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Tiểu sử không được quá 500 ký tự'],
    default: null
  }
  
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hàm kiểm tra mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// ============ VIRTUAL FIELDS ============

// Kiểm tra xem tài khoản có bị khóa không
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ============ INDEXES ============
// Note: email and username already have indexes from unique: true
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isDeleted: 1 });

// ============ INSTANCE METHODS ============

/**
 * Tăng số lần đăng nhập sai
 */
userSchema.methods.incLoginAttempts = function() {
  const authConfig = require('../config/auth');
  
  // Nếu có lockUntil và đã hết hạn, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Tăng số lần thử
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Khóa tài khoản nếu vượt quá giới hạn
  if (this.loginAttempts + 1 >= authConfig.maxLoginAttempts && !this.isLocked) {
    updates.$set = { 
      lockUntil: Date.now() + (authConfig.lockTime * 60 * 1000) 
    };
  }
  
  return this.updateOne(updates);
};

/**
 * Reset login attempts sau khi đăng nhập thành công
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Thêm refresh token mới
 */
userSchema.methods.addRefreshToken = function(token, expiresIn, deviceInfo) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
  
  this.refreshTokens.push({
    token,
    expiresAt,
    deviceInfo
  });
  
  // Giữ tối đa 5 refresh tokens (5 thiết bị)
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.save();
};

/**
 * Xóa refresh token (logout)
 */
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

/**
 * Cập nhật thông tin đăng nhập
 */
userSchema.methods.updateLoginInfo = function(ip) {
  this.lastLoginAt = Date.now();
  this.lastLoginIP = ip;
  return this.save();
};

// ============ STATIC METHODS ============

/**
 * Tìm user bằng email hoặc username
 */
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ],
    isDeleted: false
  }).select('+password');
};

/**
 * Tìm user đang active
 */
userSchema.statics.findActiveUser = function(userId) {
  return this.findOne({
    _id: userId,
    isActive: true,
    isDeleted: false
  });
};

module.exports = mongoose.model('User', userSchema);