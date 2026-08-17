const OrderModel = require('../models/orderModel');

const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;

    // Validation เบื้องต้น
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรายการสินค้า (items) ให้ถูกต้อง'
      });
    }

    // เรียกใช้ Transaction ใน Model
    const result = await OrderModel.createOrder(items);

    res.status(201).json({
      success: true,
      message: 'สั่งซื้อสินค้าสำเร็จ',
      data: result
    });
  } catch (error) {
    // ถ้าเกิด Error (เช่น สต็อกไม่พอ หรือ DB มีปัญหา) Transaction จะ ROLLBACK
    // แล้วส่ง Error มาที่นี่เข้า Centralized Error Handler
    next(error);
  }
};

module.exports = {
  createOrder
};