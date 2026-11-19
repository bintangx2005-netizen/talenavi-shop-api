const { Router } = require('express');
const categoryController = require('../controllers/category.controller');

// Public: tidak butuh login
const router = Router();

router.get('/', categoryController.list);

module.exports = router;
