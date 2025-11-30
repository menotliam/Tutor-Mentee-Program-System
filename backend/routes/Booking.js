const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');

const {
  bookSchedule,
  bookTutorSchedule,
  cancelSchedule,
  changeSchedule,
  getBookings,
  getAvailableClasses
} = require('../controllers/booking.controller');

router.post('/book', protect, bookSchedule);
router.post('/book-tutor-schedule', protect, bookTutorSchedule); // Route mới cho TutorSchedule
router.post('/cancel', protect, cancelSchedule);
router.post('/change', protect, changeSchedule);
router.get('/list', protect, getBookings);
router.get('/available-classes', protect, getAvailableClasses);

module.exports = router;