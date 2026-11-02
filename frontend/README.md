# BrewLite Frontend

Giao diện dùng Next.js App Router, React, TypeScript và Tailwind CSS.
`src/app/page.tsx` là menu mẫu; `src/app/products/[id]/page.tsx` là chi tiết món,
và `src/app/barista/page.tsx` là quầy pha chế demo theo thiết kế trong PDF Figma.

## Component dùng chung

- `src/components/ui.tsx`: button, field, stepper, badge, dialog, banner và layout.
- `src/components/products.tsx`: thẻ/lưới sản phẩm, nhóm tùy chọn và thao tác thêm giỏ.
- `src/components/checkout.tsx`: giỏ hàng, tổng tiền, voucher và thanh toán.
- `src/components/orders.tsx`: trạng thái, thẻ đơn, timeline và hoàn tiền.
- `src/components/account.tsx`: layout/form đăng nhập, hồ sơ và điểm thưởng.
- `src/components/product-detail.tsx`: chọn size, đá, topping và số lượng.
- `src/components/barista.tsx`: chuyển trạng thái demo của đơn hàng.
- `src/components/index.ts`: barrel exports cho các component dùng chung.
- Ảnh sản phẩm trong `public/` được trích từ file thiết kế giao diện được cung cấp.

Ví dụ:

```tsx
import { Button, ProductCard } from "@/components";
```

Các trang chi tiết món sử dụng `CartProvider` hiện có để lưu lựa chọn size, đá
và topping trong giỏ hàng trên trình duyệt. Đăng nhập, đặt hàng và thanh toán
không thuộc phạm vi giao diện Gói 2.

## Chạy local

```bash
npm ci
```

Tạo `frontend/.env.local` từ `.env.example`, rồi chạy backend ở cổng 3001:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Trong terminal riêng:

```bash
cd backend
npm ci
npm run start:dev
```

Quay lại terminal frontend:

```bash
npm run dev
```

Các API Gói 2 được dùng:

- `GET /products/:id`: thông tin món, giá size S/M/L và tồn kho.
- `GET /toppings`: danh sách topping cùng giá.

Quầy pha chế là giao diện demo; trạng thái đơn được chuyển cục bộ trên trình
duyệt, không gọi API đơn hàng.

Kiểm tra chất lượng bằng:

```bash
npm run lint
npm run build
```

Mở [http://localhost:3000](http://localhost:3000).
