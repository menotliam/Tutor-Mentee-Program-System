const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleMiddleware');

/**
 * ADMIN ROUTES
 * Tất cả routes yêu cầu role admin
 */

// TODO: Implement admin routes
router.get('/', authenticate, adminOnly, (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes - Coming soon',
    user: req.user
  });
});

module.exports = router;