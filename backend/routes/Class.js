const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * CLASS ROUTES
 * Quản lý lớp học
 */

// TODO: Implement class routes
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Class routes - Coming soon',
    classes: []
  });
});

module.exports = router;