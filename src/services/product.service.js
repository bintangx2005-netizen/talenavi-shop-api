const AppError = require('../utils/AppError');
const { getOffset, buildPaginationMeta } = require('../utils/pagination');
const productRepository = require('../repositories/product.repository');

async function listProducts({ page, limit, q, category, sort }) {
  const { items, total } = await productRepository.findAll({
    q,
    category,
    sort,
    limit,
    offset: getOffset(page, limit),
  });

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function getProductById(id) {
  const product = await productRepository.findById(id);
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  return product;
}

module.exports = { listProducts, getProductById };
