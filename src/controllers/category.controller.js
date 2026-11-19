// Controller kategori
const categoryService = require('../services/category.service');
const { sendSuccess } = require('../utils/response');

// GET /api/categories -> semua kategori + jumlah produknya (tanpa pagination, datanya sedikit)
async function list(req, res) {
  const categories = await categoryService.listCategories();
  return sendSuccess(res, { data: categories });
}

module.exports = { list };
