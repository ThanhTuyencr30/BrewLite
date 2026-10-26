import 'dotenv/config'; // Bắt buộc phải có dòng này ở đầu để nạp biến môi trường từ .env
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Cấu hình lệnh seed (nếu dự án của bạn có file prisma/seed.ts)
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Sử dụng process.env thay vì hàm env() để tránh lỗi đọc biến môi trường
    url: process.env.DATABASE_URL,
  },
});