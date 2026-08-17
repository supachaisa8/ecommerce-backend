const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')

// POST /api/orders - สั่งซื้อสินค้า
router.post('/', orderController.createOrder);

module.exports = router;