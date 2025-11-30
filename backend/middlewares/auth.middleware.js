const { verifyToken } = require('../utils/generateToken');
const User = require('../models/user.model');

/**
 * AUTHENTICATION MIDDLEWARE
 * Xác thực token và gắn user vào request
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header hoặc cookie
    let token = null;

    // 1. Kiểm tra Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Kiểm tra cookie (nếu không có Bearer token)
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // 3. Kiểm tra localStorage token gửi từ frontend
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.'
      });
    }

    // Verify token
    const { valid, expired, decoded, error } = verifyToken(token, 'access');

    if (!valid) {
      if (expired) {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        message: error || 'Token không hợp lệ.',
        code: 'INVALID_TOKEN'
      });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findActiveUser(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại hoặc đã bị vô hiệu hóa.'
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.'
      });
    }

    // Gắn user vào request để sử dụng ở các middleware/controller tiếp theo
    req.user = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };

    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực. Vui lòng thử lại.'
    });
  }
};

/**
 * OPTIONAL AUTHENTICATION
 * Xác thực nhưng không bắt buộc (cho các route công khai nhưng có thể tùy chỉnh theo user)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      const { valid, decoded } = verifyToken(token, 'access');

      if (valid) {
        const user = await User.findActiveUser(decoded.userId);
        if (user && !user.isLocked) {
          req.user = {
            userId: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            fullName: user.fullName
          };
        }
      }
    }

    next();
  } catch (error) {
    // Không throw error, chỉ log và continue
    console.log('Optional auth skipped:', error.message);
    next();
  }
};

/**
 * REQUIRE EMAIL VERIFICATION
 * Yêu cầu email đã được xác thực
 */
const requireEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi sử dụng tính năng này.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra xác thực email.'
    });
  }
};

/**
 * VERIFY REFRESH TOKEN
 * Xác thực refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy refresh token.'
      });
    }

    const { valid, expired, decoded, error } = verifyToken(refreshToken, 'refresh');

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: error || 'Refresh token không hợp lệ.',
        expired
      });
    }

    // Kiểm tra user và refresh token có trong DB không
    const user = await User.findActiveUser(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại.'
      });
    }

    // Kiểm tra refresh token có trong danh sách không
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã bị thu hồi.'
      });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực refresh token.'
    });
  }
};

module.exports = {
  authenticate,
  protect: authenticate, // alias cho các route dùng tên "protect"
  optionalAuth,
  requireEmailVerification,
  verifyRefreshToken
};
