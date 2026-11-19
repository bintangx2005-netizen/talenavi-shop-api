const categoryRepository = require('../repositories/category.repository');

async function listCategories() {
  return categoryRepository.findAll();
}

module.exports = { listCategories };
