const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const NotificationController = require('../controllers/notification.controller');

/**
 * NOTIFICATION ROUTES
 * Routes dành cho quản lý notifications
 */

/**
 * @route   GET /api/notifications
 * @desc    Lấy danh sách notifications của user
 * @access  Private
 * @query   isRead (optional), limit (optional, default: 50)
 */
router.get('/', authenticate, NotificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Lấy số lượng thông báo chưa đọc
 * @access  Private
 */
router.get('/unread-count', authenticate, NotificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Đánh dấu tất cả notifications đã đọc
 * @access  Private
 */
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Đánh dấu notification đã đọc
 * @access  Private
 */
router.patch('/:notificationId/read', authenticate, NotificationController.markAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Xóa notification
 * @access  Private
 */
router.delete('/:notificationId', authenticate, NotificationController.deleteNotification);

module.exports = router;
