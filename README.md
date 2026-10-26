# BrewLite

BrewLite là ứng dụng đặt đồ uống không tiền mặt, xây dựng bằng Next.js,
NestJS, PostgreSQL và Prisma.

## Yêu cầu môi trường

- Node.js 24
- npm
- PostgreSQL

## Chạy dự án

### 1. Cấu hình môi trường

Sao chép `.env.example` thành `.env` ở thư mục gốc và
`backend/.env.example` thành `backend/.env`. Điều chỉnh `DATABASE_URL` theo
PostgreSQL trên máy.

### 2. Backend

```bash
cd backend
npm ci
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend mặc định chạy tại `http://localhost:3000` và đọc API URL từ
`NEXT_PUBLIC_API_URL`.

## API menu

```http
GET /products
GET /products?search=đào
GET /products?category=ca-phe
GET /products?search=sữa&category=tra-sua
GET /categories
```

`GET /products` trả về sản phẩm đang kinh doanh, category, giá theo size và
cờ `isOutOfStock`. Seed hiện có 5 danh mục, 8 topping và 30 sản phẩm.

## Kiểm tra

```bash
cd backend
npm run lint
npm test
npm run build

cd ../frontend
npm run lint
npm run build
```
