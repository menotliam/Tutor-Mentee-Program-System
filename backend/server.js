// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db.js');
const authConfig = require('./config/auth.js');

// Import routes
const authRoutes = require('./routes/Auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/Student');
const tutorRoutes = require('./routes/Tutor');
const classRoutes = require('./routes/Class');
const bookingRoutes = require('./routes/Booking');
const scheduleRoutes = require('./routes/Schedule');
const subjectRoutes = require('./routes/Subject');
const libraryRoutes = require('./routes/library');
const notificationRoutes = require('./routes/Notification');

// Import middleware
const { errorHandler } = require('./middlewares/errorMiddleware');

// Khởi tạo app
const app = express();

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: authConfig.cors.origin,
  credentials: authConfig.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============ DATABASE CONNECTION ============
async function connectDatabase() {
  await connectDB();
  console.log('✅ MongoDB Connected');
  
  // Tự động chạy seed nếu có biến môi trường SEED_ON_START=true hoặc trong development mode
  const shouldSeed = process.env.SEED_ON_START === 'true' || 
                     (process.env.NODE_ENV === 'development' && process.env.SEED_ON_START !== 'false');
  
  if (shouldSeed) {
    try {
      // Seed users
      const { seedUsers } = require('./seeds/seed.users');
      await seedUsers(false); // false = không đóng connection
      
      // Seed classes
      const { seedClasses } = require('./seeds/seed.classes');
      await seedClasses(false);
    } catch (error) {
      console.error('⚠️  Seed failed on startup:', error.message);
      // Không dừng server nếu seed fail
    }
  }
}

// Connect to database
connectDatabase();

// ============ ROUTES ============

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CNPM Tutor System API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============ ERROR HANDLING ============
app.use(errorHandler);

// ============ START SERVER ============
// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${authConfig.cors.origin}`);
    console.log(`⏰ Server started at: ${new Date().toLocaleString()}`);
    console.log(`\n📚 API Documentation:`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`   Admin API: http://localhost:${PORT}/api/admin`);
    console.log(`   Students API: http://localhost:${PORT}/api/students`);
    console.log(`   Tutors API: http://localhost:${PORT}/api/tutors\n`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
