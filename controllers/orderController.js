const OrderModel = require('../models/orderModel');

const orderController = {
  createOrder: async (req, res, next) => {
    try {
      const { items } = req.body;
      const userId = req.user.id; // ดึง userId จาก JWT Token

      // Validation เบื้องต้น
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรายการสินค้า (items) ให้ถูกต้อง'
        });
      }
      // Validation: เช็กว่าทุก item มี quantity มากกว่า 0 และเป็นจำนวนเต็ม
      for (const item of items) {

        // แปลงค่า quantity ให้เป็น Number ก่อน
        const qty = Number(item.quantity);

        if (!item.productId || isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            message: 'จำนวนสินค้า (quantity) ต้องเป็นจำนวนเต็มที่มากกว่า 0 เท่านั้น'
          })
        }

        // แปลงค่ากลับใส่ item เพื่อให้ model นำไปใช้เป็น Number ชัวร์ๆ
        item.quantity = qty;
      }

      // เรียกใช้ Transaction ใน Model
      const result = await OrderModel.createOrderWithHold(userId, items);

      res.status(201).json({
        success: true,
        message: 'สั่งซื้อสินค้าสำเร็จ',
        data: result
      });
    } catch (error) {
      // เช็กว่าถ้าเป็น Error จากเรื่องสต็อกไม่พอ ให้ส่ง 400 Bad Request
      if (error.message.includes('ไม่เพียงพอ') || error.message.includes('ไม่พบสินค้า')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  },

  // GET /api/orders/me - ดึงประวัติสั่งซื้อของตัวเอง
  getMyOrders: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orders = await OrderModel.findByUserId(userId);
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/orders/:id - ดูรายละเอียดออเดอร์
  getOrderById: async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const order = await OrderModel.findById(orderId);

      if (!order) {
        return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
      }

      // เช็คสิทธิ์: ลูกค้าดูได้เฉพาะออเดอร์ตัวเอง เว้นแต่เป็น Admin
      if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงออเดอร์นี้' });
      }

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/orders/:id/status - Admin อัปเดตสถานะ
  updateOrderStatus: async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
      }

      const updatedOrder = await OrderModel.updateStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
      }

      res.status(200).json({ success: true, message: 'อัปเดตสถานะออเดอร์สำเร็จ', data: updatedOrder });
    } catch (error) {
      next(error);
    }
  },

  payOrder: async (req, res, next) => {
    try {
      const orderId = req.params.id;

      // เรียกใช้ Logic confirmPayment จาก Model ที่เขียนไว้
      const updatedOrder = await OrderModel.confirmPayment(orderId);

      res.status(200).json({
        success: true,
        message: 'ชำระเงินสำเร็จ และตัดสต็อกถาวรเรียบร้อยแล้ว',
        data: updatedOrder
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = orderController;