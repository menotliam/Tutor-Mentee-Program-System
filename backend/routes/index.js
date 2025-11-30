// /routes/index.js
const express = require('express');
const router = express.Router();

// Import các file route con
const authRoutes = require('./Auth');

// Đăng ký các route hiện có
// Mọi yêu cầu có đường dẫn bắt đầu bằng /auth sẽ được chuyển đến authRoutes xử lý
router.use('/auth', authRoutes);

// Export router tổng để server.js có thể sử dụng
module.exports = router;    