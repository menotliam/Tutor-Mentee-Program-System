const User = require('../models/user.model');
const { comparePassword, validatePasswordStrength } = require('../utils/passwordHash');
const {
  generateTokenPair,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken
} = require('../utils/generateToken');
const authConfig = require('../config/auth');

/**
 * REGISTER - Đăng ký tài khoản mới
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email và password là bắt buộc.'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password không đủ mạnh.',
        errors: passwordValidation.errors
      });
    }

    // Kiểm tra email domain (nếu có giới hạn)
    if (authConfig.emailVerification.allowedDomains && authConfig.emailVerification.allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1];
      if (!authConfig.emailVerification.allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
          success: false,
          message: `Chỉ chấp nhận email từ các domain: ${authConfig.emailVerification.allowedDomains.join(', ')}`
        });
      }
    }

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email đã được đăng ký.' 
          : 'Username đã tồn tại.'
      });
    }

    // Tạo user mới
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password, // Password sẽ được hash trong pre-save hook
      fullName: fullName || username,
      phoneNumber,
      role: 'student', // Mặc định là student
      isEmailVerified: !authConfig.emailVerification.required // Nếu không yêu cầu verify thì set true
    });

    // Tạo email verification token (nếu cần)
    if (authConfig.emailVerification.required) {
      const verificationToken = generateEmailVerificationToken(newUser._id, email);
      newUser.emailVerificationToken = verificationToken;
      newUser.emailVerificationExpires = Date.now() + (authConfig.emailVerification.tokenExpiresIn * 60 * 60 * 1000);
    }

    await newUser.save();

    // Gửi email xác thực (nếu cần)
    if (authConfig.emailVerification.required) {
      // TODO: Implement email service
      // await emailService.sendVerificationEmail(email, verificationToken);
    }

    return res.status(201).json({
      success: true,
      message: authConfig.emailVerification.required 
        ? 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
        : 'Đăng ký thành công!',
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.',
      error: error.message
    });
  }
};

/**
 * LOGIN - Đăng nhập
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc.'
      });
    }

    // Tìm user (bao gồm cả password)
    const user = await User.findByEmailOrUsername(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng.'
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${lockTimeRemaining} phút.`
      });
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ admin.'
      });
    }

    // So sánh password
    const isPasswordMatch = await comparePassword(password, user.password);

    if (!isPasswordMatch) {
      // Tăng số lần đăng nhập sai
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Email hoặc password không đúng.'
      });
    }

    // Kiểm tra email verification (nếu yêu cầu)
    if (authConfig.emailVerification.required && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi đăng nhập.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Tạo tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id,
      user.email,
      user.role
    );

    // Lưu refresh token vào DB
    const deviceInfo = `${req.headers['user-agent']} - ${req.ip}`;
    await user.addRefreshToken(refreshToken, authConfig.refreshTokenExpiresIn, deviceInfo);

    // Cập nhật thông tin đăng nhập
    await user.updateLoginInfo(req.ip);

    // Set cookie (nếu cần)
    if (authConfig.cookieSettings) {
      res.cookie('auth_token', accessToken, {
        httpOnly: authConfig.cookieSettings.httpOnly,
        secure: authConfig.cookieSettings.secure,
        sameSite: authConfig.cookieSettings.sameSite,
        maxAge: authConfig.cookieSettings.maxAge
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.',
      error: error.message
    });
  }
};

/**
 * LOGOUT - Đăng xuất
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      const user = await User.findById(req.user.userId);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear cookie
    res.clearCookie('auth_token');

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công!'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * REFRESH TOKEN - Lấy access token mới
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    // Tạo access token mới
    const { accessToken } = generateTokenPair(
      user._id,
      user.email,
      user.role
    );

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * VERIFY EMAIL - Xác thực email
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const { valid, decoded, error } = verifyToken(token, 'access');

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: error || 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được xác thực trước đó.'
      });
    }

    // Cập nhật trạng thái
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * FORGOT PASSWORD - Yêu cầu reset password
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Không tiết lộ user có tồn tại hay không (security)
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được link reset password.'
      });
    }

    // Kiểm tra số lần request trong ngày
    if (user.lastPasswordResetRequest) {
      const hoursSinceLastRequest = (Date.now() - user.lastPasswordResetRequest) / (1000 * 60 * 60);
      
      if (hoursSinceLastRequest < 24 && user.passwordResetAttempts >= authConfig.passwordReset.maxRequestsPerDay) {
        return res.status(429).json({
          success: false,
          message: 'Bạn đã vượt quá số lần yêu cầu reset password trong ngày. Vui lòng thử lại sau 24 giờ.'
        });
      }

      // Reset counter nếu đã qua 24h
      if (hoursSinceLastRequest >= 24) {
        user.passwordResetAttempts = 0;
      }
    }

    // Tạo reset token
    const resetToken = generatePasswordResetToken(user._id, user.email);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + (authConfig.passwordReset.tokenExpiresIn * 60 * 60 * 1000);
    user.passwordResetAttempts += 1;
    user.lastPasswordResetRequest = Date.now();

    await user.save();

    // TODO: Gửi email
    // await emailService.sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Link reset password đã được gửi đến email của bạn.',
      // Dev only - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * RESET PASSWORD - Reset password với token
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password và confirm password là bắt buộc.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password và confirm password không khớp.'
      });
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password không đủ mạnh.',
        errors: passwordValidation.errors
      });
    }

    const { valid, decoded, error } = verifyToken(token, 'access');

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: error || 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.passwordResetToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ.'
      });
    }

    // Gán password mới (sẽ được hash trong pre-save hook)
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Reset password thành công! Bạn có thể đăng nhập với password mới.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * GET CURRENT USER - Lấy thông tin user hiện tại
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * GET PROFILE - Lấy thông tin profile đầy đủ
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    const profile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Thêm thông tin student-specific nếu là student
    if (user.role === 'student') {
      profile.studentId = user.studentId;
      profile.GPA = user.GPA;
      profile.major = user.major;
      profile.academicYear = user.academicYear;
      profile.conductScore = user.conductScore;
    }

    return res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

/**
 * UPDATE PROFILE STUDENT - Chỉ dành cho student update 3 trường: studentId, fullName, phoneNumber
 * PUT /api/auth/profile/student
 */
const updateProfileStudent = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    // Chỉ cho phép student update
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'API này chỉ dành cho student.'
      });
    }

    // Chỉ lấy 3 trường được phép update
    const { studentId, fullName, phoneNumber } = req.body;

    // Update các trường
    if (fullName !== undefined) {
      user.fullName = fullName;
    }
    
    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber;
    }
    
    if (studentId !== undefined) {
      user.studentId = studentId;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật profile thành công!',
      profile: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        GPA: user.GPA,
        major: user.major,
        academicYear: user.academicYear,
        conductScore: user.conductScore
      }
    });

  } catch (error) {
    console.error('Update profile student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server.',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  getProfile,
  updateProfileStudent
};
