// Controller order. Sama seperti cart: user diambil dari token (req.user.id).
const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response');

// POST /api/orders -> checkout. Tidak butuh body: yang di-checkout adalah isi cart di database.
// 201 karena membuat resource baru (order).
async function checkout(req, res) {
  const order = await orderService.checkout(req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Checkout successful', data: order });
}

// GET /api/orders?page=1&limit=10 -> riwayat order
async function list(req, res) {
  const { items, meta } = await orderService.listOrders(req.user.id, req.validated.query);
  return sendSuccess(res, { data: items, meta });
}

// GET /api/orders/:id -> detail order beserta item-itemnya
async function show(req, res) {
  const order = await orderService.getOrderById(req.user.id, req.validated.params.id);
  return sendSuccess(res, { data: order });
}

module.exports = { checkout, list, show };
