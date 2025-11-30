// /config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool configuration để tối ưu performance
      maxPoolSize: 10, // Số connection tối đa trong pool
      minPoolSize: 2, // Số connection tối thiểu trong pool
      
      socketTimeoutMS: 45000, // Timeout cho socket operations
      
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Lỗi kết nối CSDL: ${error.message}`);
    process.exit(1); // Thoát khỏi tiến trình nếu không kết nối được DB
  }
};

module.exports = { connectDB };