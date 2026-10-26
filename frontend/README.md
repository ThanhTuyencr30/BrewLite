# BrewLite Frontend

Giao diện được xây dựng bằng Next.js App Router, React và Tailwind CSS. Trang
`src/app/page.tsx` hiện là màn menu mẫu tương tác; component nghiệp vụ nhận
callbacks để kết nối với API và state management sau này.

## Component dùng chung

- `src/components/ui.tsx`: button, field, stepper, badge, dialog, banner và layout.
- `src/components/products.tsx`: thẻ/lưới sản phẩm, nhóm tùy chọn và thao tác thêm giỏ.
- `src/components/checkout.tsx`: giỏ hàng, tổng tiền, voucher và thanh toán.
- `src/components/orders.tsx`: trạng thái, thẻ đơn, timeline và hoàn tiền.
- `src/components/account.tsx`: layout/form đăng nhập, hồ sơ và điểm thưởng.
- `src/components/index.ts`: barrel exports cho các component dùng chung.

Ví dụ:

```tsx
import { Button, ProductCard } from "@/components";
```

Các component chỉ trình bày giao diện và gọi callback; dữ liệu giỏ hàng, đơn
hàng, khuyến mãi và thanh toán cần được nối với service/state của ứng dụng.

## Chạy local

```bash
npm ci
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Kiểm tra chất lượng bằng
`npm run lint` và `npm run build`.
