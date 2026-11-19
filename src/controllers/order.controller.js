const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response');

async function checkout(req, res) {
  const order = await orderService.checkout(req.user.id);
  return sendSuccess(res, { statusCode: 201, message: 'Checkout successful', data: order });
}

async function list(req, res) {
  const { items, meta } = await orderService.listOrders(req.user.id, req.validated.query);
  return sendSuccess(res, { data: items, meta });
}

async function show(req, res) {
  const order = await orderService.getOrderById(req.user.id, req.validated.params.id);
  return sendSuccess(res, { data: order });
}

module.exports = { checkout, list, show };
