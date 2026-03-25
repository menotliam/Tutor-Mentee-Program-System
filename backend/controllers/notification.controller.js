const Notification = require('../models/notification.model');

/**
 * NotificationController
 * Xử lý logic cho notifications
 */
class NotificationController {
  
  /**
   * @desc    Lấy danh sách notifications của user
   * @route   GET /api/notifications
   * @access  Private
   */
  static async getNotifications(req, res) {
    try {
      const userId = req.user._id || req.user.userId;
      const { isRead, limit = 50 } = req.query;
      
      const query = { recipientId: userId };
      if (isRead !== undefined) {
        query.isRead = isRead === 'true';
      }
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
      
      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        isRead: false
      });
      
      res.status(200).json({
        success: true,
        data: notifications,
        unreadCount,
        total: notifications.length
      });
      
    } catch (error) {
      console.error('Error in getNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thông báo',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Đánh dấu notification đã đọc
   * @route   PATCH /api/notifications/:notificationId/read
   * @access  Private
   */
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id || req.user.userId;
      
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đọc',
        data: notification
      });
      
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Đánh dấu tất cả notifications đã đọc
   * @route   PATCH /api/notifications/read-all
   * @access  Private
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user._id || req.user.userId;
      
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu tất cả đã đọc',
        modifiedCount: result.modifiedCount
      });
      
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Xóa notification
   * @route   DELETE /api/notifications/:notificationId
   * @access  Private
   */
  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id || req.user.userId;
      
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Đã xóa thông báo'
      });
      
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa thông báo',
        error: error.message
      });
    }
  }
  
  /**
   * @desc    Lấy số lượng thông báo chưa đọc
   * @route   GET /api/notifications/unread-count
   * @access  Private
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user._id || req.user.userId;
      
      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        isRead: false
      });
      
      res.status(200).json({
        success: true,
        unreadCount
      });
      
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy số lượng thông báo',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
