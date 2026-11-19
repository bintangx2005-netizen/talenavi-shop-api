// Data awal untuk seeder. Harga dalam Rupiah.

const categories = [
  { slug: 'smartphones', name: 'Smartphones' },
  { slug: 'laptops', name: 'Laptops' },
  { slug: 'audio', name: 'Audio' },
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'home-appliances', name: 'Home Appliances' },
];

// category = slug kategori, nanti diubah jadi category_id oleh seeder
const products = [
  // Smartphones
  { sku: 'SP-001', category: 'smartphones', title: 'Nusa Phone X1', description: 'Smartphone 6.5 inci, RAM 8GB, storage 128GB, kamera 50MP.', price: 3499000, stock: 25 },
  { sku: 'SP-002', category: 'smartphones', title: 'Nusa Phone X1 Pro', description: 'Layar AMOLED 120Hz, RAM 12GB, storage 256GB, baterai 5000mAh.', price: 5999000, stock: 15 },
  { sku: 'SP-003', category: 'smartphones', title: 'Garuda Lite 5G', description: 'Ponsel 5G terjangkau dengan layar 6.6 inci dan fast charging 33W.', price: 2799000, stock: 40 },
  { sku: 'SP-004', category: 'smartphones', title: 'Garuda Ultra', description: 'Flagship dengan kamera periskop 5x zoom dan chipset terbaru.', price: 12999000, stock: 8 },
  { sku: 'SP-005', category: 'smartphones', title: 'Kirana Mini Phone', description: 'Smartphone ringkas 5.8 inci, cocok untuk satu tangan.', price: 2199000, stock: 30 },
  { sku: 'SP-006', category: 'smartphones', title: 'Kirana Fold', description: 'Ponsel lipat dengan layar dalam 7.6 inci. Stok terbatas.', price: 19999000, stock: 2 },

  // Laptops
  { sku: 'LP-001', category: 'laptops', title: 'Bromo Book 14', description: 'Laptop 14 inci, Intel Core i5, RAM 16GB, SSD 512GB.', price: 9499000, stock: 12 },
  { sku: 'LP-002', category: 'laptops', title: 'Bromo Book 16 Pro', description: 'Laptop kreator 16 inci, layar 2.5K, RAM 32GB, SSD 1TB.', price: 18999000, stock: 6 },
  { sku: 'LP-003', category: 'laptops', title: 'Rinjani Gaming 15', description: 'Laptop gaming RTX 4060, layar 165Hz, RAM 16GB.', price: 16499000, stock: 10 },
  { sku: 'LP-004', category: 'laptops', title: 'Rinjani Air 13', description: 'Ultrabook 1.1kg dengan baterai hingga 15 jam.', price: 11999000, stock: 9 },
  { sku: 'LP-005', category: 'laptops', title: 'Semeru Student 14', description: 'Laptop pelajar, Ryzen 3, RAM 8GB, SSD 256GB.', price: 5299000, stock: 20 },
  { sku: 'LP-006', category: 'laptops', title: 'Semeru Workstation 17', description: 'Workstation 17 inci untuk rendering dan data science.', price: 27999000, stock: 3 },

  // Audio
  { sku: 'AU-001', category: 'audio', title: 'Suara Buds TWS', description: 'Earbuds true wireless dengan ANC dan baterai 30 jam.', price: 699000, stock: 60 },
  { sku: 'AU-002', category: 'audio', title: 'Suara Buds Pro', description: 'Earbuds premium dengan spatial audio dan mode transparan.', price: 1499000, stock: 35 },
  { sku: 'AU-003', category: 'audio', title: 'Gema Headphone Studio', description: 'Headphone over-ear untuk monitoring studio.', price: 2299000, stock: 14 },
  { sku: 'AU-004', category: 'audio', title: 'Gema Speaker Mini', description: 'Speaker Bluetooth portabel tahan air IPX7.', price: 499000, stock: 50 },
  { sku: 'AU-005', category: 'audio', title: 'Gema Soundbar 2.1', description: 'Soundbar dengan subwoofer nirkabel, 300W.', price: 2899000, stock: 7 },
  { sku: 'AU-006', category: 'audio', title: 'Irama Microphone USB', description: 'Mikrofon kondenser USB untuk podcast dan streaming.', price: 899000, stock: 22 },

  // Fashion
  { sku: 'FS-001', category: 'fashion', title: 'Kemeja Batik Parang', description: 'Kemeja batik katun lengan panjang motif parang.', price: 289000, stock: 45 },
  { sku: 'FS-002', category: 'fashion', title: 'Kaos Polos Premium', description: 'Kaos katun combed 30s, tersedia berbagai warna.', price: 89000, stock: 120 },
  { sku: 'FS-003', category: 'fashion', title: 'Jaket Denim Classic', description: 'Jaket denim unisex dengan potongan regular fit.', price: 399000, stock: 28 },
  { sku: 'FS-004', category: 'fashion', title: 'Sneakers Lari Ringan', description: 'Sepatu lari dengan sol empuk dan upper mesh.', price: 649000, stock: 33 },
  { sku: 'FS-005', category: 'fashion', title: 'Tas Ransel Laptop', description: 'Ransel tahan air dengan kompartemen laptop 15.6 inci.', price: 349000, stock: 40 },
  { sku: 'FS-006', category: 'fashion', title: 'Topi Baseball Kanvas', description: 'Topi kanvas dengan strap yang bisa diatur.', price: 79000, stock: 80 },

  // Home Appliances
  { sku: 'HA-001', category: 'home-appliances', title: 'Rice Cooker Digital 1.8L', description: 'Rice cooker dengan 8 mode masak dan timer.', price: 599000, stock: 26 },
  { sku: 'HA-002', category: 'home-appliances', title: 'Air Fryer 4L', description: 'Air fryer tanpa minyak dengan layar sentuh.', price: 899000, stock: 18 },
  { sku: 'HA-003', category: 'home-appliances', title: 'Blender Serbaguna', description: 'Blender 2L dengan 3 kecepatan dan pulse.', price: 349000, stock: 32 },
  { sku: 'HA-004', category: 'home-appliances', title: 'Vacuum Cleaner Cordless', description: 'Penyedot debu tanpa kabel, baterai 40 menit.', price: 1799000, stock: 11 },
  { sku: 'HA-005', category: 'home-appliances', title: 'Kipas Angin Berdiri', description: 'Kipas angin 16 inci dengan remote dan timer.', price: 429000, stock: 24 },
  { sku: 'HA-006', category: 'home-appliances', title: 'Dispenser Galon Bawah', description: 'Dispenser air panas, dingin, dan normal dengan galon bawah.', price: 1599000, stock: 9 },
];

// Password akan di-hash oleh seeder sebelum disimpan
const users = [
  { name: 'Test User', email: 'user@example.com', password: 'password123', role: 'customer' },
  { name: 'Admin', email: 'admin@example.com', password: 'admin12345', role: 'admin' },
];

module.exports = { categories, products, users };
