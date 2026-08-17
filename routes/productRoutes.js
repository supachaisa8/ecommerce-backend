const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validateProduct = require('../middleware/validateProduct');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// เฉพาะ admin เท่านั้นที่ เพิ่ม/แก้ไข/ลบ สินค้าได้
router.post('/', authenticate, authorize('admin'), productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

// ใส่ validateProduct ก่อนเข้า Controller
router.post('/', validateProduct, productController.createProduct);
router.put('/:id', validateProduct, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;