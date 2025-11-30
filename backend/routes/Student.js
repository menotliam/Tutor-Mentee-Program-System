const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { studentOnly } = require('../middlewares/roleMiddleware');

/**
 * STUDENT ROUTES
 * Routes dành cho student
 */

// TODO: Implement student routes
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Student routes - Coming soon',
    user: req.user
  });
});

module.exports = router;