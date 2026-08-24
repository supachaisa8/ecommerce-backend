const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate); // บังคับ Login ทุก Endpoint ในไฟล์นี้

// POST /api/orders - สั่งซื้อสินค้า
router.post('/', orderController.createOrder);
router.get('/me', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/pay', orderController.payOrder);

// เฉพาะ Admin เท่านั้นที่เปลี่ยนสถานะ Order ได้
router.patch('/:id/status', authorize('admin'), orderController.updateOrderStatus);

module.exports = router;