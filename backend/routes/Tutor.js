const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { instructorOnly, instructorOrAdmin } = require('../middlewares/roleMiddleware');
const TutorScheduleController = require('../controllers/tutorSchedule.controller');

/**
 * INSTRUCTOR/TUTOR ROUTES
 * Routes dành cho instructor
 * Base path: /api/tutors
 */

// Profile routes
router.get('/profile', authenticate, instructorOnly, TutorScheduleController.getProfile);
router.patch('/profile', authenticate, instructorOnly, TutorScheduleController.updateProfile);

// Teaching subjects
router.get('/teaching-subjects', authenticate, instructorOnly, TutorScheduleController.getTeachingSubjects);

// Bookings routes
router.get('/bookings', authenticate, instructorOnly, TutorScheduleController.getMyBookings);
router.patch('/bookings/:bookingId', authenticate, instructorOnly, TutorScheduleController.updateBookingStatus);

// Classes routes
router.get('/classes', authenticate, instructorOnly, TutorScheduleController.getMyClasses);
router.get('/enrolled-students', authenticate, instructorOnly, TutorScheduleController.getEnrolledStudents);
router.get('/enrolled-students-grouped', authenticate, instructorOnly, TutorScheduleController.getEnrolledStudentsGrouped);
router.get('/classes-with-students', authenticate, instructorOnly, TutorScheduleController.getClassesWithStudents);

// General tutor route
router.get('/', authenticate, instructorOrAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Instructor routes',
    user: req.user
  });
});

module.exports = router;