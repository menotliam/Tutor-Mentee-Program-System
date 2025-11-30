const authConfig = require('../config/auth.js');

/**
 * CHECK ROLE MIDDLEWARE
 * Kiểm tra user có role phù hợp không
 * 
 * Usage: requireRole('admin', 'tutor')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này.',
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * CHECK PERMISSION MIDDLEWARE
 * Kiểm tra user có permission cụ thể không
 * 
 * Usage: requirePermission('read:classes')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.'
      });
    }

    const userRole = req.user.role;
    const hasPermission = authConfig.hasPermission(userRole, permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền '${permission}'.`,
        requiredPermission: permission,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * CHECK MULTIPLE PERMISSIONS
 * User phải có ít nhất 1 trong các permissions
 * 
 * Usage: requireAnyPermission(['read:classes', 'update:classes'])
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.'
      });
    }

    const userRole = req.user.role;
    const hasAnyPermission = permissions.some(permission => 
      authConfig.hasPermission(userRole, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này.',
        requiredPermissions: permissions,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * CHECK RESOURCE OWNERSHIP
 * Kiểm tra user có phải là owner của resource không
 * 
 * Usage: requireOwnership('userId') // check req.params.userId === req.user.userId
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.'
      });
    }

    // Admin có thể truy cập tất cả
    if (req.user.role === 'admin') {
      return next();
    }

    // Lấy userId từ params hoặc body
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin user trong request.'
      });
    }

    // So sánh với user hiện tại
    if (!req.user?.userId || resourceUserId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này.'
      });
    }

    next();
  };
};

/**
 * CHECK ROLE OR OWNERSHIP
 * Cho phép truy cập nếu có role phù hợp HOẶC là owner
 * 
 * Usage: requireRoleOrOwnership(['admin', 'tutor'], 'tutorId')
 */
const requireRoleOrOwnership = (allowedRoles, resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.'
      });
    }

    const userRole = req.user.role;

    // Kiểm tra role
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Kiểm tra ownership
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId && req.user?.userId && resourceUserId.toString() === req.user.userId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này.'
    });
  };
};

/**
 * ADMIN ONLY
 * Shortcut cho requireRole('admin')
 */
const adminOnly = requireRole('admin');

/**
 * INSTRUCTOR ONLY
 * Shortcut cho requireRole('instructor')
 */
const instructorOnly = requireRole('instructor');

/**
 * STUDENT ONLY
 * Shortcut cho requireRole('student')
 */
const studentOnly = requireRole('student');

/**
 * INSTRUCTOR OR ADMIN
 * Shortcut cho requireRole('admin', 'instructor')
 */
const instructorOrAdmin = requireRole('admin', 'instructor');

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireOwnership,
  requireRoleOrOwnership,
  adminOnly,
  instructorOnly,
  studentOnly,
  instructorOrAdmin
};
