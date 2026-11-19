const { Router } = require('express');
const categoryController = require('../controllers/category.controller');

// Public: tidak butuh login
const router = Router();

// GET /api/categories (tanpa validate karena tidak ada input)
router.get('/', categoryController.list);

module.exports = router;
