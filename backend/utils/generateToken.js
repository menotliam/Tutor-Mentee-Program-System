const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * GENERATE ACCESS TOKEN
 * Tạo JWT access token cho user
 */
const generateAccessToken = (userId, email, role) => {
  const payload = {
    userId,
    email,
    role,
    type: 'access'
  };

  const token = jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
    issuer: authConfig.issuer,
    algorithm: authConfig.jwtAlgorithm
  });

  return token;
};

/**
 * GENERATE REFRESH TOKEN
 * Tạo refresh token để lấy access token mới
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh'
  };

  const token = jwt.sign(payload, authConfig.refreshTokenSecret, {
    expiresIn: authConfig.refreshTokenExpiresIn,
    issuer: authConfig.issuer,
    algorithm: authConfig.jwtAlgorithm
  });

  return token;
};

/**
 * GENERATE EMAIL VERIFICATION TOKEN
 * Tạo token để xác thực email
 */
const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification'
  };

  const token = jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: `${authConfig.emailVerification.tokenExpiresIn}h`,
    issuer: authConfig.issuer
  });

  return token;
};

/**
 * GENERATE PASSWORD RESET TOKEN
 * Tạo token để reset password
 */
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    timestamp: Date.now() // Để đảm bảo mỗi token là duy nhất
  };

  const token = jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: `${authConfig.passwordReset.tokenExpiresIn}h`,
    issuer: authConfig.issuer
  });

  return token;
};

/**
 * VERIFY TOKEN
 * Xác thực token và trả về payload
 */
const verifyToken = (token, tokenType = 'access') => {
  try {
    const secret = tokenType === 'refresh' 
      ? authConfig.refreshTokenSecret 
      : authConfig.jwtSecret;

    const decoded = jwt.verify(token, secret, {
      issuer: authConfig.issuer
    });

    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        expired: true,
        decoded: null,
        error: 'Token đã hết hạn'
      };
    }

    if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        expired: false,
        decoded: null,
        error: 'Token không hợp lệ'
      };
    }

    return {
      valid: false,
      expired: false,
      decoded: null,
      error: error.message
    };
  }
};

/**
 * DECODE TOKEN WITHOUT VERIFICATION
 * Giải mã token mà không verify (dùng để kiểm tra payload)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * GENERATE TOKEN PAIR
 * Tạo cả access token và refresh token
 */
const generateTokenPair = (userId, email, role) => {
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  decodeToken,
  generateTokenPair
};
