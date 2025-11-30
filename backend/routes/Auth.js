const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, verifyRefreshToken } = require('../middlewares/auth.middleware');

/**
 * PUBLIC ROUTES - Không cần authentication
 */

// Đăng ký tài khoản mới
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Xác thực email
router.get('/verify-email/:token', authController.verifyEmail);

// Yêu cầu reset password
router.post('/forgot-password', authController.forgotPassword);

// Reset password với token
router.post('/reset-password/:token', authController.resetPassword);

/**
 * PROTECTED ROUTES - Cần authentication
 */

// Đăng xuất
router.post('/logout', authenticate, authController.logout);

// Lấy access token mới từ refresh token
router.post('/refresh-token', verifyRefreshToken, authController.refreshToken);

// Lấy thông tin user hiện tại
router.get('/me', authenticate, authController.getCurrentUser);

// Lấy profile đầy đủ
router.get('/profile', authenticate, authController.getProfile);

// Cập nhật profile student (chỉ 3 trường: studentId, fullName, phoneNumber)
router.put('/profile/student', authenticate, authController.updateProfileStudent);

module.exports = router;
