const jwt = require('jsonwebtoken');

// ตรวจสอบ Token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (No Token)' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    req.user = decoded; // แนบข้อมูล user (id, role) ไปกับ request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// ตรวจสอบ Role (เช่น เฉพาะ admin)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Forbidden)' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };