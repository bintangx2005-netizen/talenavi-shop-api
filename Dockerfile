# Image aplikasi API.
# node:24-slim (Debian) dipilih daripada alpine karena bcrypt memakai modul native
# yang paling mulus di glibc.
FROM node:24-slim

WORKDIR /app

# Copy package*.json DULU lalu install, baru copy source code.
# Docker menyimpan cache per langkah: selama dependency tidak berubah, langkah
# npm ci tidak diulang walaupun source code berubah -> build jauh lebih cepat.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

ENV NODE_ENV=production \
    PORT=3000

# Jangan jalankan aplikasi sebagai root (prinsip least privilege)
USER node

EXPOSE 3000

# Saat container start: migrate (hanya file yang belum jalan) -> seed (idempotent,
# stok tidak ditimpa) -> jalankan server.
# `exec` membuat node menjadi proses utama, sehingga sinyal SIGTERM dari
# `docker compose down/stop` diterima server.js dan dijalankan graceful shutdown.
CMD ["sh", "-c", "node src/database/migrate.js && node src/database/seed.js && exec node src/server.js"]
