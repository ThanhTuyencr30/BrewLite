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
cờ `isOutOfStock`. Seed hiện có 6 danh mục, 8 topping và 27 sản phẩm.

## API giỏ hàng và mã giảm giá

```http
POST /cart/validate
GET /promotions/me
POST /promotions/validate
```

`POST /cart/validate` nhận `items` gồm `productId`, `size`, `quantity` và
`expectedUnitPrice`; API kiểm tra tồn kho, giá hiện tại và trả về các thay đổi
cần xác nhận. `GET /promotions/me` hiện trả về các mã khuyến mãi công khai (kể
cả mã hết hạn để giao diện hiển thị trạng thái) vì ứng dụng chưa có xác thực
người dùng. `POST /promotions/validate` nhận `code` và danh sách `items` như
endpoint xác thực giỏ hàng; backend tự tính subtotal trước khi kiểm tra thời
hạn, lượt sử dụng và giá trị đơn tối thiểu. Mỗi lần kiểm tra chỉ nhận một mã;
giới hạn một mã/người/ngày sẽ được bổ sung khi hệ thống có xác thực và tạo đơn
hàng. Seed tạo `GIAM15` (giảm 15%, đơn từ 50.000đ), `GIAM20` (giảm 20.000đ,
đơn từ 120.000đ) và `GIAM10K` (giảm 10.000đ, đã hết hạn ngày 30/09/2026).

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
