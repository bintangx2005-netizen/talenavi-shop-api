// Service produk: logika katalog (pagination & 404). SQL-nya ada di product.repository.
const AppError = require('../utils/AppError');
const { getOffset, buildPaginationMeta } = require('../utils/pagination');
const productRepository = require('../repositories/product.repository');

// Ubah page -> offset untuk repository, lalu susun meta pagination untuk response
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
  // Repository mengembalikan null, service yang memutuskan itu berarti 404
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  return product;
}

module.exports = { listProducts, getProductById };
