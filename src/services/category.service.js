// Service kategori. Saat ini hanya meneruskan ke repository (belum ada logika bisnis),
// tapi tetap dibuat agar strukturnya konsisten: controller -> service -> repository.
const categoryRepository = require('../repositories/category.repository');

async function listCategories() {
  return categoryRepository.findAll();
}

module.exports = { listCategories };
