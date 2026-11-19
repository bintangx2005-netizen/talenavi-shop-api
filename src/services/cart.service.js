// Aturan bisnis cart:
// 1. Produk yang sama ditambahkan lagi -> quantity bertambah (bukan baris baru)
// 2. Quantity minimal 1 (dijaga validator) dan tidak boleh melebihi stok
// 3. User hanya bisa mengakses item miliknya sendiri (item orang lain -> 404)
//
// Catatan: stok di sini dicek sebagai validasi awal. Stok bisa berubah setelah item
// masuk cart (dibeli user lain), jadi pengecekan final yang menentukan tetap ada saat
// checkout, di dalam transaction dengan row lock.
const AppError = require('../utils/AppError');
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');

// Tambahkan subtotal dan flag ketersediaan stok ke setiap item
function withSubtotal(item) {
  return {
    ...item,
    subtotal: item.product.price * item.quantity,
    is_stock_sufficient: item.quantity <= item.product.stock,
  };
}

// "assert" = pastikan kondisi terpenuhi, kalau tidak lempar error (422)
function assertWithinStock(quantity, stock, alreadyInCart = 0) {
  if (quantity > stock) {
    const detail =
      alreadyInCart > 0
        ? `Quantity exceeds available stock (${stock}). You already have ${alreadyInCart} in your cart.`
        : `Quantity exceeds available stock (${stock}).`;
    throw AppError.validation({ quantity: [detail] });
  }
}

// Total dihitung di JS dari data terbaru, tidak disimpan di database
// (kalau disimpan, bisa basi saat harga produk berubah).
async function getCart(userId) {
  const items = (await cartRepository.findAllByUser(userId)).map(withSubtotal);

  // reduce = menjumlahkan semua item menjadi satu angka, mulai dari 0
  return {
    items,
    total_items: items.length,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    total_price: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

async function addItem(userId, { product_id: productId, quantity }) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const existing = await cartRepository.findByUserAndProduct(userId, productId);
  // ?. dan ?? : kalau belum ada di cart (existing = null), anggap quantity-nya 0
  const alreadyInCart = existing?.quantity ?? 0;

  // Yang dicek adalah total quantity SETELAH ditambah
  assertWithinStock(alreadyInCart + quantity, product.stock, alreadyInCart);

  // Upsert, lalu ambil ulang item lengkap (dengan data produk) untuk response
  const itemId = await cartRepository.addQuantity(userId, productId, quantity);
  const item = await cartRepository.findByIdForUser(itemId, userId);

  // created dipakai controller: true -> 201 Created, false (quantity ditambah) -> 200 OK
  return { item: withSubtotal(item), created: !existing };
}

// Mengganti quantity (bukan menambah). Item harus milik user ini.
async function updateItem(userId, itemId, { quantity }) {
  const item = await cartRepository.findByIdForUser(itemId, userId);
  if (!item) {
    throw AppError.notFound('Cart item not found');
  }

  assertWithinStock(quantity, item.product.stock);

  await cartRepository.updateQuantity(itemId, userId, quantity);
  return withSubtotal({ ...item, quantity });
}

// DELETE langsung dengan filter user_id; tidak ada baris terhapus = 404
async function removeItem(userId, itemId) {
  const deleted = await cartRepository.deleteByIdForUser(itemId, userId);
  if (!deleted) {
    throw AppError.notFound('Cart item not found');
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
