const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// ต้องผ่าน authenticate ทุก Endpoint ในไฟล์นี้
router.use(authenticate);

// List & Add Cart
router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);

// Single Item Actions
router.patch('/items/:id', cartController.updateItemQuantity);
router.delete('/items/:id', cartController.deleteItem);

module.exports = router;