const categoryService = require('../services/category.service');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const categories = await categoryService.listCategories();
  return sendSuccess(res, { data: categories });
}

module.exports = { list };
