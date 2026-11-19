const cartService = require('../services/cart.service');
const { sendSuccess } = require('../utils/response');

async function show(req, res) {
  const cart = await cartService.getCart(req.user.id);
  return sendSuccess(res, { data: cart });
}

async function addItem(req, res) {
  const { item, created } = await cartService.addItem(req.user.id, req.validated.body);

  // 201 kalau baris baru dibuat, 200 kalau hanya menambah quantity item yang sudah ada
  return sendSuccess(res, {
    statusCode: created ? 201 : 200,
    message: created ? 'Item added to cart' : 'Item quantity updated',
    data: item,
  });
}

async function updateItem(req, res) {
  const item = await cartService.updateItem(req.user.id, req.validated.params.id, req.validated.body);
  return sendSuccess(res, { message: 'Cart item updated', data: item });
}

async function removeItem(req, res) {
  await cartService.removeItem(req.user.id, req.validated.params.id);
  return sendSuccess(res, { message: 'Cart item removed' });
}

module.exports = { show, addItem, updateItem, removeItem };
