// Controller produk (lihat penjelasan peran controller di auth.controller.js)
const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');

// GET /api/products -> data = daftar produk, meta = info pagination
async function list(req, res) {
  const { items, meta } = await productService.listProducts(req.validated.query);
  return sendSuccess(res, { data: items, meta });
}

// GET /api/products/:id -> id sudah berupa number hasil validasi idParamSchema
async function show(req, res) {
  const product = await productService.getProductById(req.validated.params.id);
  return sendSuccess(res, { data: product });
}

module.exports = { list, show };
