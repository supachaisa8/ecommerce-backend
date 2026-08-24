const express = require('express')
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', tagController.getTags);
router.post('/', authenticate, authorize('admin'), tagController.createTag);
router.put('/:id', authenticate, authorize('admin'), tagController.updateTag);
router.delete('/:id', authenticate, authorize('admin'), tagController.deleteTag);

module.exports = router;