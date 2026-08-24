// Middleware สำหรับดัก Route ที่ไม่มีอยู่จริง (404)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler สำหรับจับ Exception ทั้งหมด (500)
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'เกิดข้อผิดพลาดภายในระบบ';

  // ดักจับ PostgreSQL Error Code: 23505 (Unique Constraint Violation)
  if (err.code === '23505') {
    let customMessage = 'ข้อมูลนี้มีอยู่ในระบบแล้ว';

    // เช็กชื่อตารางจาก err.table
    if (err.table === 'categories') {
      customMessage = 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว'
    } else if (err.table === 'tags') {
      customMessage = 'ชื่อ Tag นี้มีอยู่ในระบบแล้ว'
    } else if (err.table === 'users') {
      customMessage = 'อีเมลนี้ถูกใช้งานในระบบแล้ว'
    }

    return res.status(400).json({
      success: false,
      message: customMessage
    });
  }

  console.error(`[Error Log] ${err.stack}`);

    res.status(statusCode).json({
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดภายในระบบ',
      // ใน production จะซ่อน stack trace เพื่อความปลอดภัย
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };

  module.exports = { notFoundHandler, errorHandler };