// Service order: checkout (bagian paling penting di project ini), riwayat, dan detail order.
const { withTransaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { getOffset, buildPaginationMeta } = require('../utils/pagination');
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const orderRepository = require('../repositories/order.repository');

// Subtotal item order dihitung dari harga SNAPSHOT (order_items.price), bukan harga produk sekarang
function withSubtotal(item) {
  return { ...item, subtotal: item.price * item.quantity };
}

/**
 * CHECKOUT: mengubah seluruh isi cart menjadi order.
 *
 * Semua langkah berjalan di dalam SATU database transaction (withTransaction):
 * kalau ada satu langkah gagal (stok kurang, error DB, dll) -> ROLLBACK,
 * tidak ada perubahan yang tersimpan sama sekali.
 *
 *   1. Ambil & kunci isi cart        -> kosong? gagal (422)
 *   2. Ambil & kunci baris produk    -> row lock, cegah race condition stok
 *   3. Cek stok semua item           -> ada yang kurang? gagal (409) + sebutkan produknya
 *   4. Hitung total dari harga SAAT INI
 *   5. Buat order + order_items      -> harga disimpan sebagai snapshot
 *   6. Kurangi stok produk
 *   7. Kosongkan cart
 *   COMMIT
 */
async function checkout(userId) {
  // Semua query di bawah memakai `client` (koneksi transaksi), BUKAN pool,
  // supaya semuanya masuk ke transaksi yang sama.
  return withTransaction(async (client) => {
    // 1. Isi cart (dikunci)
    const cartItems = await cartRepository.findForCheckout(userId, client);
    if (cartItems.length === 0) {
      throw AppError.validation({ cart: ['Your cart is empty'] }, 'Cart is empty');
    }

    // 2. Produk terkait (dikunci). Transaksi lain yang mau membeli produk yang
    //    sama akan menunggu di sini sampai transaksi ini selesai.
    const productIds = cartItems.map((item) => item.product_id);
    const products = await productRepository.findByIdsForUpdate(productIds, client);
    // Map id -> produk agar pencarian produk per item cepat: productById.get(6)
    const productById = new Map(products.map((product) => [product.id, product]));

    // 3. Validasi stok. Kumpulkan SEMUA produk yang kurang, bukan hanya yang pertama,
    //    supaya user tahu sekaligus item mana saja yang harus diubah.
    const insufficient = [];
    for (const item of cartItems) {
      const product = productById.get(item.product_id);
      if (item.quantity > product.stock) {
        insufficient.push(
          `"${product.title}" (product_id ${product.id}): requested ${item.quantity}, available ${product.stock}`,
        );
      }
    }
    // throw di dalam withTransaction -> otomatis ROLLBACK (lock juga dilepas)
    if (insufficient.length > 0) {
      throw AppError.conflict('Insufficient stock for some products', { stock: insufficient });
    }

    // 4. Total dihitung dari harga produk saat ini (bukan dari input client)
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + productById.get(item.product_id).price * item.quantity,
      0,
    );

    // 5. Buat order dan item-itemnya
    const order = await orderRepository.create({ userId, totalPrice }, client);

    const orderItems = [];
    for (const item of cartItems) {
      const product = productById.get(item.product_id);
      const orderItem = await orderRepository.createItem(
        {
          orderId: order.id,
          productId: product.id,
          productTitle: product.title,
          quantity: item.quantity,
          price: product.price, // snapshot harga saat checkout
        },
        client,
      );
      orderItems.push(withSubtotal(orderItem));

      // 6. Kurangi stok. CHECK (stock >= 0) di tabel products menjadi pengaman terakhir.
      await productRepository.decrementStock(product.id, item.quantity, client);
    }

    // 7. Kosongkan cart
    await cartRepository.clearByUser(userId, client);

    // return tanpa error -> withTransaction menjalankan COMMIT, semua perubahan tersimpan
    return { ...order, items: orderItems };
  });
}

// Riwayat order milik user (dengan pagination). Hanya baca, jadi tidak perlu transaksi.
async function listOrders(userId, { page, limit }) {
  const { items, total } = await orderRepository.findAllByUser(userId, {
    limit,
    offset: getOffset(page, limit),
  });
  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

// Detail order. Order milik user lain -> 404 (bukan 403), supaya keberadaannya tidak bocor.
async function getOrderById(userId, orderId) {
  const order = await orderRepository.findByIdForUser(orderId, userId);
  if (!order) {
    throw AppError.notFound('Order not found');
  }

  const items = await orderRepository.findItemsByOrderId(order.id);
  return { ...order, items: items.map(withSubtotal) };
}

module.exports = { checkout, listOrders, getOrderById };
