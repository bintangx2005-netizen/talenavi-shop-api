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

// ---------- Admin (route-nya dijaga authenticate + authorize('admin')) ----------

// POST /api/products -> 201 karena membuat resource baru
async function create(req, res) {
  const product = await productService.createProduct(req.validated.body);
  return sendSuccess(res, { statusCode: 201, message: 'Product created', data: product });
}

// PATCH /api/products/:id -> hanya field yang dikirim yang berubah
async function update(req, res) {
  const product = await productService.updateProduct(req.validated.params.id, req.validated.body);
  return sendSuccess(res, { message: 'Product updated', data: product });
}

// DELETE /api/products/:id -> 200 dengan pesan (data: null), sama seperti hapus item cart
async function remove(req, res) {
  await productService.deleteProduct(req.validated.params.id);
  return sendSuccess(res, { message: 'Product deleted' });
}

module.exports = { list, show, create, update, remove };
