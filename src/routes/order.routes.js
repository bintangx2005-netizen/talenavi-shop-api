const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { idParamSchema, paginationQuerySchema } = require('../validators/common.validator');

const router = Router();

// Semua endpoint order wajib login
router.use(authenticate);

// POST /api/orders = checkout (membuat order baru dari isi cart)
router.post('/', orderController.checkout);
router.get('/', validate({ query: paginationQuerySchema }), orderController.list);
router.get('/:id', validate({ params: idParamSchema }), orderController.show);

module.exports = router;
