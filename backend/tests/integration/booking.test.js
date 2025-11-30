const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/user.model');
const Class = require('../../models/class.model');
const Booking = require('../../models/booking.model');
const TutorSchedule = require('../../models/tutorSchedule.model');
const { connectDB } = require('../../config/db');
const app = require('../../server');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  
  while (mongoose.connection.readyState !== 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Booking API Integration Tests', () => {
  let studentToken;
  let studentId;
  let student2Token;
  let student2Id;
  let tutorToken;
  let tutorId;
  let validClassId;
  let fullClassId;
  let cancelledClassId;
  let pastClassId;
  let nearFutureClassId;
  let farFutureClassId;

  beforeAll(async () => {
    await User.deleteMany({ email: { $in: ['teststudent@test.com', 'teststudent2@test.com', 'testtutor@test.com'] } });
    await Class.deleteMany({});
    await Booking.deleteMany({});
    await TutorSchedule.deleteMany({});

    const student = await User.create({
      username: 'teststudent',
      email: 'teststudent@test.com',
      password: 'Test123!',
      role: 'student',
      fullName: 'Test Student',
      isEmailVerified: true,
      isActive: true
    });
    studentId = student._id;

    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teststudent@test.com',
        password: 'Test123!'
      });
    studentToken = loginRes1.body.token;

    const student2 = await User.create({
      username: 'teststudent2',
      email: 'teststudent2@test.com',
      password: 'Test123!',
      role: 'student',
      fullName: 'Test Student 2',
      isEmailVerified: true,
      isActive: true
    });
    student2Id = student2._id;

    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teststudent2@test.com',
        password: 'Test123!'
      });
    student2Token = loginRes2.body.token;

    const tutor = await User.create({
      username: 'testtutor',
      email: 'testtutor@test.com',
      password: 'Test123!',
      role: 'instructor',
      fullName: 'Test Tutor',
      isEmailVerified: true,
      isActive: true
    });
    tutorId = tutor._id;

    const loginRes3 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testtutor@test.com',
        password: 'Test123!'
      });
    tutorToken = loginRes3.body.token;

    const now = new Date();

    const validClass = await Class.create({
      name: 'Test Class Available',
      tutorId: tutorId,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [],
      isCancelled: false
    });
    validClassId = validClass._id;

    const fullClass = await Class.create({
      name: 'Test Class Full',
      tutorId: tutorId,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [studentId, student2Id],
      isCancelled: false
    });
    fullClassId = fullClass._id;

    const cancelledClass = await Class.create({
      name: 'Test Class Cancelled',
      tutorId: tutorId,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [],
      isCancelled: true
    });
    cancelledClassId = cancelledClass._id;

    const pastClass = await Class.create({
      name: 'Test Class Past',
      tutorId: tutorId,
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [],
      isCancelled: false
    });
    pastClassId = pastClass._id;

    nearFutureClassId = (await Class.create({
      name: 'Test Class Near Future',
      tutorId: tutorId,
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [],
      isCancelled: false
    }))._id;

    farFutureClassId = (await Class.create({
      name: 'Test Class Far Future',
      tutorId: tutorId,
      startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      maxCapacity: 2,
      students: [],
      isCancelled: false
    }))._id;
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await TutorSchedule.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['teststudent@test.com', 'teststudent2@test.com', 'testtutor@test.com'] } });
    await Class.deleteMany({});
    await Booking.deleteMany({});
    await TutorSchedule.deleteMany({});
  });

  describe('TC-BOOK-006: Book class with non-existent class ID', () => {
    test('should return error when booking with invalid scheduleId', async () => {
      const invalidScheduleId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/bookings/book-tutor-schedule')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          scheduleId: invalidScheduleId,
          timeSlot: '08-10',
          subject: {
            subjectCode: 'MATH101',
            subjectName: 'Mathematics'
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Lịch rảnh không tồn tại');
    });
  });

  describe('TC-BOOK-009: Cancel booking less than 3 hours before class', () => {
    test('should reject cancellation if less than 3 hours before class', async () => {
      const now = new Date();
      const sessionStartTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const dateStr = sessionStartTime.toISOString().split('T')[0];
      const startHour = sessionStartTime.getHours();
      const timeSlot = `${String(startHour).padStart(2, '0')}-${String(startHour + 2).padStart(2, '0')}`;

      const nearFutureSchedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: dateStr,
        timeSlots: [timeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: timeSlot,
          students: [studentId],
          maxCapacity: 4
        }]
      });

      const booking = await Booking.create({
        userId: studentId,
        tutorId: tutorId,
        scheduleId: nearFutureSchedule._id,
        timeSlot: timeSlot,
        date: dateStr,
        subject: {
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        },
        status: 'ACTIVE'
      });

      const response = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: booking._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Phải hủy lịch trước giờ bắt đầu ít nhất 3 tiếng');
    });
  });

  describe('TC-BOOK-010: Cancel booking that is already cancelled', () => {
    test('should return error when trying to cancel already cancelled booking', async () => {
      const now = new Date();
      const sessionStartTime = new Date(now.getTime() + 4 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000);
      const dateStr = sessionStartTime.toISOString().split('T')[0];
      const startHour = sessionStartTime.getHours();
      const timeSlot = `${String(startHour).padStart(2, '0')}-${String(startHour + 2).padStart(2, '0')}`;

      const schedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: dateStr,
        timeSlots: [timeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: timeSlot,
          students: [],
          maxCapacity: 4
        }]
      });

      const cancelledBooking = await Booking.create({
        userId: studentId,
        tutorId: tutorId,
        scheduleId: schedule._id,
        timeSlot: timeSlot,
        date: dateStr,
        subject: {
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        },
        status: 'CANCELLED',
        cancelledAt: new Date()
      });

      const response = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: cancelledBooking._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TC-BOOK-011: Cancel another user\'s booking', () => {
    test('should reject when student tries to cancel another student\'s booking', async () => {
      const now = new Date();
      const sessionStartTime = new Date(now.getTime() + 4 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000);
      const dateStr = sessionStartTime.toISOString().split('T')[0];
      const startHour = sessionStartTime.getHours();
      const timeSlot = `${String(startHour).padStart(2, '0')}-${String(startHour + 2).padStart(2, '0')}`;

      const schedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: dateStr,
        timeSlots: [timeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: timeSlot,
          students: [student2Id],
          maxCapacity: 4
        }]
      });

      const student2Booking = await Booking.create({
        userId: student2Id,
        tutorId: tutorId,
        scheduleId: schedule._id,
        timeSlot: timeSlot,
        date: dateStr,
        subject: {
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        },
        status: 'ACTIVE'
      });

      const response = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: student2Booking._id
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không có quyền');
    });
  });

  describe('TC-BOOK-012: Cancel booking without bookingId', () => {
    test('should return error when bookingId is missing', async () => {
      const response = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bookingId');
    });

    test('should return error when bookingId is empty', async () => {
      const response = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TC-BOOK-015: Change booking to full schedule', () => {
    test('should reject change when new schedule is full', async () => {
      const now = new Date();
      const oldSessionStartTime = new Date(now.getTime() + 4 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000);
      const oldDateStr = oldSessionStartTime.toISOString().split('T')[0];
      const oldStartHour = oldSessionStartTime.getHours();
      const oldTimeSlot = `${String(oldStartHour).padStart(2, '0')}-${String(oldStartHour + 2).padStart(2, '0')}`;

      const oldSchedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: oldDateStr,
        timeSlots: [oldTimeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: oldTimeSlot,
          students: [studentId],
          maxCapacity: 4
        }]
      });

      const activeBooking = await Booking.create({
        userId: studentId,
        tutorId: tutorId,
        scheduleId: oldSchedule._id,
        timeSlot: oldTimeSlot,
        date: oldDateStr,
        subject: {
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        },
        status: 'ACTIVE'
      });

      const newSessionStartTime = new Date(now.getTime() + 5 * 60 * 60 * 1000 + 4 * 24 * 60 * 60 * 1000);
      const newDateStr = newSessionStartTime.toISOString().split('T')[0];
      const newStartHour = newSessionStartTime.getHours();
      const newTimeSlot = `${String(newStartHour).padStart(2, '0')}-${String(newStartHour + 2).padStart(2, '0')}`;

      const newSchedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: newDateStr,
        timeSlots: [newTimeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: newTimeSlot,
          students: [student2Id, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
          maxCapacity: 4
        }]
      });

      const response = await request(app)
        .post('/api/bookings/change')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          oldBookingId: activeBooking._id,
          newScheduleId: newSchedule._id,
          newTimeSlot: newTimeSlot,
          newSubject: {
            subjectCode: 'MATH101',
            subjectName: 'Mathematics'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Khung giờ mới đã đầy');
    });
  });

  describe('TC-BOOK-016: Change booking less than 3 hours before old class', () => {
    test('should reject change when old schedule starts in < 3 hours', async () => {
      const now = new Date();
      const oldSessionStartTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const year = oldSessionStartTime.getFullYear();
      const month = String(oldSessionStartTime.getMonth() + 1).padStart(2, '0');
      const day = String(oldSessionStartTime.getDate()).padStart(2, '0');
      const oldDateStr = `${year}-${month}-${day}`;
      const oldStartHour = oldSessionStartTime.getHours();
      const oldTimeSlot = `${String(oldStartHour).padStart(2, '0')}-${String(oldStartHour + 2).padStart(2, '0')}`;

      const oldSchedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: oldDateStr,
        timeSlots: [oldTimeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: oldTimeSlot,
          students: [studentId],
          maxCapacity: 4
        }]
      });

      const activeBooking = await Booking.create({
        userId: studentId,
        tutorId: tutorId,
        scheduleId: oldSchedule._id,
        timeSlot: oldTimeSlot,
        date: oldDateStr,
        subject: {
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        },
        status: 'ACTIVE'
      });

      const newSessionStartTime = new Date(now.getTime() + 5 * 60 * 60 * 1000 + 5 * 24 * 60 * 60 * 1000);
      const newDateStr = newSessionStartTime.toISOString().split('T')[0];
      const newStartHour = newSessionStartTime.getHours();
      const newTimeSlot = `${String(newStartHour).padStart(2, '0')}-${String(newStartHour + 2).padStart(2, '0')}`;

      const newSchedule = await TutorSchedule.create({
        tutorId: tutorId,
        date: newDateStr,
        timeSlots: [newTimeSlot],
        subjects: [{
          subjectCode: 'MATH101',
          subjectName: 'Mathematics'
        }],
        isAvailable: true,
        enrollments: [{
          timeSlot: newTimeSlot,
          students: [],
          maxCapacity: 4
        }]
      });

      const response = await request(app)
        .post('/api/bookings/change')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          oldBookingId: activeBooking._id,
          newScheduleId: newSchedule._id,
          newTimeSlot: newTimeSlot,
          newSubject: {
            subjectCode: 'MATH101',
            subjectName: 'Mathematics'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Phải đổi lịch trước giờ bắt đầu ít nhất 3 tiếng');
    });
  });
});

