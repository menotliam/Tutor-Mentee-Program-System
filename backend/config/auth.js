/**
 * AUTH CONFIGURATION
 * 
 * File này chứa tất cả cấu hình liên quan đến xác thực (Authentication)
 * và phân quyền (Authorization) của hệ thống
 */

const authConfig = {
    // ============ JWT TOKEN SETTINGS ============
    
    // Secret key để mã hóa JWT token (nên lưu trong .env)
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    
    // Thời gian hết hạn của Access Token (token chính để xác thực)
    // 1h = 1 giờ, 15m = 15 phút, 7d = 7 ngày
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    
    // Refresh Token - dùng để lấy access token mới khi hết hạn
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret-key',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    
    // Thuật toán mã hóa JWT
    jwtAlgorithm: 'HS256',
    
    // Tên ứng dụng (dùng trong token claims)
    issuer: process.env.APP_NAME || 'CNPM-Tutor-System',
    
    // ============ PASSWORD SETTINGS ============
    
    // Số lần hash password (bcrypt rounds)
    // Càng cao càng bảo mật nhưng càng chậm (khuyến nghị: 10-12)
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    
    // Độ dài tối thiểu của password
    minPasswordLength: 6,
    
    // ============ SESSION SETTINGS ============
    
    // Thời gian timeout của session (milliseconds)
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 hours
    
    // ============ SECURITY SETTINGS ============
    
    // Số lần đăng nhập sai tối đa trước khi khóa tài khoản
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    
    // Thời gian khóa tài khoản (minutes)
    lockTime: parseInt(process.env.LOCK_TIME) || 30,
    
    // Cho phép nhiều thiết bị đăng nhập cùng lúc
    allowMultipleDevices: process.env.ALLOW_MULTIPLE_DEVICES !== 'false',
    
    // ============ COOKIE SETTINGS ============
    
    cookieSettings: {
      // Tên cookie lưu token
      cookieName: 'auth_token',
      
      // HttpOnly: Cookie không thể truy cập qua JavaScript (bảo mật XSS)
      httpOnly: true,
      
      // Secure: Chỉ gửi cookie qua HTTPS (bật trong production)
      secure: process.env.NODE_ENV === 'production',
      
      // SameSite: Bảo vệ CSRF attacks
      sameSite: 'strict',
      
      // Thời gian sống của cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    
    // ============ ROLES & PERMISSIONS ============
    
    roles: {
      ADMIN: 'admin',
      INSTRUCTOR: 'instructor',
      STUDENT: 'student',
      PENDING_INSTRUCTOR: 'pending_instructor', // Sinh viên đã apply làm instructor, chờ admin duyệt
    },
    
    // Định nghĩa quyền truy cập cho từng route
    permissions: {
      admin: ['all'], // Admin có toàn quyền
      instructor: [
        'read:classes',
        'create:classes',
        'update:classes',
        'delete:classes',
        'update:own-profile',
        'read:students',
        'read:student-details', // Xem chi tiết sinh viên đăng ký lớp
        'create:schedules',
        'update:schedules',
        'delete:schedules',
        'read:bookings',
        'update:bookings',
        'approve:bookings',
        'reject:bookings',
        'read:library',
        'create:library-resources', // Instructor có thể đóng góp tài liệu
      ],
      student: [
        'read:classes',
        'update:own-profile',
        'create:bookings',
        'read:own-bookings',
        'cancel:own-bookings',
        'read:library',
        'read:own-history',
        'apply:instructor', // Quyền đăng ký làm instructor
      ],
      pending_instructor: [
        // Giống student nhưng không thể apply instructor nữa
        'read:classes',
        'update:own-profile',
        'create:bookings',
        'read:own-bookings',
        'cancel:own-bookings',
        'read:library',
        'read:own-history',
      ],
    },
    
    // ============ INSTRUCTOR APPLICATION REQUIREMENTS ============
    
    instructorRequirements: {
      // GPA tối thiểu
      minGPA: 3.2,
      
      // Điểm môn học tối thiểu
      minSubjectGrade: 8.5,
      
      // Điểm rèn luyện tối thiểu
      minTrainingScore: 80,
      
      // Không được có điểm F
      allowFailedSubjects: false,
      
      // Thời gian chờ admin duyệt (days)
      approvalWaitingTime: 7,
    },
    
    // ============ EMAIL VERIFICATION ============
    
    emailVerification: {
      // Yêu cầu xác thực email trước khi đăng nhập
      // Frontend gọi: /api/auth/register -> gửi email xác thực
      required: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      
      // Thời gian hết hạn của link xác thực email (hours)
      tokenExpiresIn: 24,
      
      // Email domain được phép đăng ký (để giới hạn chỉ sinh viên trường)
      allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS 
        ? process.env.ALLOWED_EMAIL_DOMAINS.split(',') 
        : ['hcmut.edu.vn', 'gmail.com'], // Ví dụ: chỉ cho phép @hcmut.edu.vn
    },
    
    // ============ PASSWORD RESET ============
    
    passwordReset: {
      // Thời gian hết hạn của link reset password (hours)
      tokenExpiresIn: 1,
      
      // Số lần tối đa có thể request reset password trong 1 ngày
      maxRequestsPerDay: 3,
    },
    
    // ============ OAUTH SETTINGS (Optional) ============
    
    oauth: {
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      facebook: {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
      },
    },
    
    // ============ FRONTEND INTEGRATION ============
    
    // CORS settings cho frontend
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
      credentials: true, // Cho phép gửi cookies
    },
    
    // Routes mapping với frontend
    frontendRoutes: {
      afterLogin: '/firstpage', // Tất cả đều vào firstpage
      afterLogout: '/login',
      afterRegister: '/login',
      studentDashboard: '/firstpage',
      instructorDashboard: '/firstpage',
      adminDashboard: '/firstpage',
      profile: '/profile',
      calendar: '/calendar',
      instructorCalendar: '/setcalendar',
      library: '/library',
      history: '/history',
      classList: '/classlist',
      studentList: '/studentlist',
      instructorRegister: '/tutor-register',
    },
    
    // Token storage location cho frontend
    tokenStorage: {
      location: 'localStorage', // hoặc 'sessionStorage', 'cookie'
      key: 'authToken',
      userDataKey: 'user',
    },
  };
  
  // ============ HELPER FUNCTIONS ============
  
  /**
   * Kiểm tra xem role có quyền thực hiện action không
   * @param {string} role - Role của user (admin, tutor, student)
   * @param {string} permission - Permission cần kiểm tra (vd: 'read:classes')
   * @returns {boolean}
   */
  authConfig.hasPermission = (role, permission) => {
    const rolePermissions = authConfig.permissions[role];
    if (!rolePermissions) return false;
    
    // Admin có toàn quyền
    if (rolePermissions.includes('all')) return true;
    
    // Kiểm tra permission cụ thể
    return rolePermissions.includes(permission);
  };
  
  /**
   * Lấy danh sách routes mà role có thể truy cập
   * @param {string} role - Role của user
   * @returns {array}
   */
  authConfig.getAccessibleRoutes = (role) => {
    return authConfig.permissions[role] || [];
  };
  
  module.exports = authConfig;
  