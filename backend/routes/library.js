const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * LIBRARY ROUTES
 * Quản lý thư viện tài liệu
 */

// TODO: Implement library routes
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Library routes - Coming soon',
    resources: []
  });
});

module.exports = router;