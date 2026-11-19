const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');
const { idParamSchema } = require('../validators/common.validator');

const router = Router();

// ---------- Public: tidak butuh login ----------

// GET /api/products       -> validasi query (page, limit, q, category, sort)
router.get('/', validate({ query: listProductsQuerySchema }), productController.list);
// GET /api/products/:id   -> validasi :id harus bilangan bulat positif
router.get('/:id', validate({ params: idParamSchema }), productController.show);

// ---------- Admin only ----------
// Urutan middleware penting:
//   authenticate      -> tidak ada / token salah  = 401 (siapa kamu?)
//   authorize('admin') -> login tapi bukan admin   = 403 (kamu tidak boleh)
//   validate          -> body tidak valid         = 422
// Validasi diletakkan SETELAH cek role, supaya user non-admin tidak bisa
// "mengintip" aturan validasi endpoint admin.
const adminOnly = [authenticate, authorize('admin')];

router.post('/', adminOnly, validate({ body: createProductSchema }), productController.create);
router.patch(
  '/:id',
  adminOnly,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update,
);
router.delete('/:id', adminOnly, validate({ params: idParamSchema }), productController.remove);

module.exports = router;
