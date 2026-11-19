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

// ---------- Admin: create / update / delete ----------

// Kode error resmi PostgreSQL
const PG_UNIQUE_VIOLATION = '23505'; // nilai UNIQUE sudah dipakai (sku kembar)
const PG_FOREIGN_KEY_VIOLATION = '23503'; // FK tidak valid / masih direferensikan

// Error dari database diterjemahkan menjadi error yang jelas untuk client.
// Database dijadikan "sumber kebenaran": tidak perlu SELECT cek dulu, sehingga tidak ada
// celah race condition antara "cek" dan "simpan".
function translateWriteError(err) {
  if (err.code === PG_UNIQUE_VIOLATION) {
    return AppError.conflict('SKU is already used by another product', {
      sku: ['SKU is already used by another product'],
    });
  }
  // Saat create/update, FK yang gagal = category_id tidak ada di tabel categories
  if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    return AppError.validation({ category_id: ['Category not found'] });
  }
  return err; // error lain dilempar apa adanya -> 500
}

async function createProduct(data) {
  try {
    return await productRepository.create(data);
  } catch (err) {
    throw translateWriteError(err);
  }
}

async function updateProduct(id, data) {
  let product;
  try {
    product = await productRepository.update(id, data);
  } catch (err) {
    throw translateWriteError(err);
  }
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  return product;
}

/**
 * Hapus produk.
 * - Item di cart user ikut terhapus (FK cart_items ON DELETE CASCADE).
 * - Produk yang sudah pernah dipesan TIDAK bisa dihapus (FK order_items ON DELETE RESTRICT),
 *   supaya riwayat order tetap utuh -> 409. Alternatifnya: set stock = 0.
 */
async function deleteProduct(id) {
  let deleted;
  try {
    deleted = await productRepository.remove(id);
  } catch (err) {
    if (err.code === PG_FOREIGN_KEY_VIOLATION) {
      throw AppError.conflict('Product has order history and cannot be deleted', {
        product: ['Product has order history. Set its stock to 0 to stop selling it.'],
      });
    }
    throw err;
  }
  if (!deleted) {
    throw AppError.notFound('Product not found');
  }
}

module.exports = { listProducts, getProductById, createProduct, updateProduct, deleteProduct };
