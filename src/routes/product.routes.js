const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const { listProductsQuerySchema } = require('../validators/product.validator');
const { idParamSchema } = require('../validators/common.validator');

// Public: tidak butuh login
const router = Router();

router.get('/', validate({ query: listProductsQuerySchema }), productController.list);
router.get('/:id', validate({ params: idParamSchema }), productController.show);

module.exports = router;
