/**
 * ERROR MIDDLEWARE
 * Xử lý tất cả errors trong ứng dụng
 */

/**
 * NOT FOUND ERROR
 * Middleware để xử lý 404 errors
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  /**
   * ERROR HANDLER
   * Middleware tổng để xử lý tất cả errors
   */
  const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    const response = {
      success: false,
      message: err.message,
      statusCode
    };
  
    // Thêm stack trace trong development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.error = err;
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      response.statusCode = 400;
      response.message = 'Validation Error';
      response.errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
    }
  
    // Mongoose duplicate key error
    if (err.code === 11000) {
      response.statusCode = 409;
      response.message = 'Duplicate field value';
      const field = Object.keys(err.keyPattern)[0];
      response.field = field;
      response.errors = [{
        field,
        message: `${field} đã tồn tại trong hệ thống`
      }];
    }
  
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
      response.statusCode = 400;
      response.message = 'Invalid ID format';
      response.errors = [{
        field: err.path,
        message: `${err.path} không hợp lệ`
      }];
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      response.statusCode = 401;
      response.message = 'Token không hợp lệ';
    }
  
    if (err.name === 'TokenExpiredError') {
      response.statusCode = 401;
      response.message = 'Token đã hết hạn';
    }
  
    // Log error
    console.error('❌ Error:', {
      message: err.message,
      statusCode: response.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  
    res.status(response.statusCode).json(response);
  };
  
  /**
   * ASYNC HANDLER
   * Wrapper để xử lý async errors trong route handlers
   */
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  /**
   * CUSTOM ERROR CLASS
   * Tạo custom error với status code
   */
  class ApiError extends Error {
    constructor(message, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    ApiError
  };
  