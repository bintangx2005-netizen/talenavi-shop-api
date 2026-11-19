const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const { items, meta } = await productService.listProducts(req.validated.query);
  return sendSuccess(res, { data: items, meta });
}

async function show(req, res) {
  const product = await productService.getProductById(req.validated.params.id);
  return sendSuccess(res, { data: product });
}

module.exports = { list, show };
