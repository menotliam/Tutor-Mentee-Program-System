const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { instructorOnly } = require('../middlewares/roleMiddleware');
const TutorScheduleController = require('../controllers/tutorSchedule.controller');

/**
 * SCHEDULE ROUTES
 * Quản lý lịch rảnh của tutor
 * Base path: /api/schedules
 */

// Tạo hoặc cập nhật lịch rảnh
// POST /api/schedules
router.post('/', authenticate, instructorOnly, TutorScheduleController.createOrUpdateSchedule);

// Lấy lịch rảnh của tutor hiện tại
// GET /api/schedules?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/', authenticate, instructorOnly, TutorScheduleController.getMySchedules);

// Xóa một lịch rảnh theo ID
// DELETE /api/schedules/:scheduleId
router.delete('/:scheduleId', authenticate, instructorOnly, TutorScheduleController.deleteSchedule);

// Xóa lịch rảnh theo ngày
// DELETE /api/schedules/date/:date
router.delete('/date/:date', authenticate, instructorOnly, TutorScheduleController.deleteScheduleByDate);

// Lấy danh sách tutor có lịch rảnh (cho sinh viên)
// GET /api/schedules/available-tutors
router.get('/available-tutors', TutorScheduleController.getAvailableTutors);

// Lấy lịch rảnh của một tutor cụ thể (cho sinh viên)
// GET /api/schedules/tutor/:tutorId
router.get('/tutor/:tutorId', TutorScheduleController.getTutorSchedules);

module.exports = router;