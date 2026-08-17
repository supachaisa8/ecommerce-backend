const { body, validationResult } = require('express-validator');

// กฎการตรวจเช็คข้อมูลสินค้า
const validateProduct = [
  body('name')
    .notEmpty().withMessage('ชื่อสินค้าห้ามเป็นค่าว่าง')
    .isString().withMessage('ชื่อสินค้าต้องเป็นข้อความ')
    .trim(),
  body('price')
    .notEmpty().withMessage('กรุณาระบุราคา')
    .isFloat({ min: 0 }).withMessage('ราคาต้องเป็นตัวเลขจำนวนบวกเท่านั้น'),
  body('stock')
    .notEmpty().withMessage('กรุณาระบุจำนวนสต็อก')
    .isInt({ min: 0 }).withMessage('จำนวนสต็อกต้องเป็นจำนวนเต็มไม่ติดลบ'),
  
  // Handler สำหรับรวบรวม Error ถ้าข้อมูลไม่ผ่านเกณฑ์
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }
    next(); // ถ้าผ่าน ส่งต่อไปยัง Controller
  }
];

module.exports = validateProduct;