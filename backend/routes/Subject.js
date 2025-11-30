const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * SUBJECT ROUTES
 * Quản lý môn học
 */

// TODO: Implement subject routes
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Subject routes - Coming soon',
    subjects: []
  });
});

module.exports = router;