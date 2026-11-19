const { Router } = require('express');
const cartController = require('../controllers/cart.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { addCartItemSchema, updateCartItemSchema } = require('../validators/cart.validator');
const { idParamSchema } = require('../validators/common.validator');

const router = Router();

// Semua endpoint cart wajib login
router.use(authenticate);

router.get('/', cartController.show);
router.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
router.patch(
  '/items/:id',
  validate({ params: idParamSchema, body: updateCartItemSchema }),
  cartController.updateItem,
);
router.delete('/items/:id', validate({ params: idParamSchema }), cartController.removeItem);

module.exports = router;
