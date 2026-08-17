// Middleware สำหรับดัก Route ที่ไม่มีอยู่จริง (404)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler สำหรับจับ Exception ทั้งหมด (500)
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error Log] ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'เกิดข้อผิดพลาดภายในระบบ',
    // ใน production จะซ่อน stack trace เพื่อความปลอดภัย
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { notFoundHandler, errorHandler };