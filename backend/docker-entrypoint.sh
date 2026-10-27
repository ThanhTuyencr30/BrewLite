#!/bin/sh
set -e

npx prisma migrate deploy

# Seed đặt lại tồn kho, nên chỉ chạy khi database chưa có sản phẩm.
if node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query('SELECT COUNT(*)::int AS count FROM products'))
  .then((result) => process.exit(result.rows[0].count === 0 ? 0 : 1))
  .catch(() => process.exit(1));
"; then
  npx prisma db seed
fi

exec node dist/main.js
