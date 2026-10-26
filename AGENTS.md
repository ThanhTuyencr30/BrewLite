# AGENTS.md - Quy ước phát triển BrewLite

Tài liệu này áp dụng cho toàn bộ repository. Khi làm việc trong `frontend/`,
phải đọc thêm `frontend/AGENTS.md`; quy tắc gần file hơn được ưu tiên nếu có
xung đột.

## 1. Tổng quan dự án

- `frontend/`: Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- `backend/`: NestJS 12, TypeScript, Jest.
- Môi trường mẫu nằm trong `.env.example` và `backend/.env.example`.
- Mỗi thư mục ứng dụng có `package.json` và `package-lock.json` riêng. Dùng
  `npm`; không tạo thêm lockfile của Yarn hoặc pnpm.

## 2. Cài đặt và chạy local

Yêu cầu: Node.js 20 trở lên và npm.

```bash
# Frontend - mặc định http://localhost:3000
cd frontend
npm ci
npm run dev

# Backend - mặc định http://localhost:3001
cd backend
npm ci
npm run start:dev
```

Sao chép `.env.example` thành `.env` khi cần cấu hình local. Không commit
`.env`, mật khẩu, token, khóa API hoặc thông tin nhạy cảm.

## 3. Nguyên tắc chung

- Viết TypeScript và giữ `strict` mode; không dùng `any` nếu có thể khai báo
  kiểu cụ thể.
- Mỗi file chỉ nên đảm nhận một vai trò rõ ràng. Tách component, service hoặc
  helper khi file bắt đầu quá lớn hay có nhiều trách nhiệm.
- Đặt tên bằng tiếng Anh, rõ nghĩa; không viết tắt khó hiểu.
- Component, class, interface và type dùng `PascalCase`; biến và hàm dùng
  `camelCase`; hằng số toàn cục dùng `UPPER_SNAKE_CASE`.
- Ưu tiên early return, hàm ngắn và dữ liệu immutable. Không để code chết,
  `console.log` tạm, import thừa hay comment đã lỗi thời.
- Không sửa file sinh tự động, thư mục build hoặc dependency: `node_modules/`,
  `.next/`, `dist/`, `coverage/`, `*.tsbuildinfo`.
- Không tự ý thay đổi API, schema dữ liệu, biến môi trường hay dependency nếu
  task không yêu cầu. Nếu bắt buộc thay đổi, cập nhật tài liệu và nói rõ trong PR.
- Lưu file bằng UTF-8 để nội dung tiếng Việt không bị lỗi font/encoding.

## 4. Quy ước đặt tên file

- Tên file và thư mục tự tạo dùng tiếng Anh, chữ thường và `kebab-case`, ví dụ
  `product-card.tsx`, `order-history/`, `format-currency.ts`.
- Không dùng khoảng trắng, tiếng Việt có dấu hoặc tên chung chung như
  `utils2.ts`, `new-file.ts`, `test-final.ts`.
- React component dùng tên file `kebab-case`; tên component export bên trong
  dùng `PascalCase`, ví dụ `product-card.tsx` export `ProductCard`.
- Custom hook bắt đầu bằng `use-`, ví dụ `use-cart.ts`; context dùng hậu tố
  `.context.tsx`; provider dùng hậu tố `.provider.tsx`.
- File TypeScript dùng hậu tố thể hiện đúng vai trò khi phù hợp:
  `.service.ts`, `.controller.ts`, `.module.ts`, `.dto.ts`, `.entity.ts`,
  `.repository.ts`, `.guard.ts`, `.middleware.ts`, `.pipe.ts`.
- File test đặt cạnh code với hậu tố `.spec.ts`/`.spec.tsx`; e2e test dùng
  `.e2e-spec.ts` trong thư mục `test/`.
- Với Next.js App Router, giữ nguyên tên file đặc biệt theo framework:
  `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`,
  `route.ts`.
- File chỉ chứa type dùng hậu tố `.types.ts`; file hằng số dùng
  `.constants.ts`. Không tạo file gom chung nếu nội dung chỉ thuộc một feature.
- Tên file phải mô tả đúng nội dung chính; khi đổi tên symbol chính, đổi tên
  file tương ứng để tránh lệch nghĩa.

## 5. Frontend

- Dùng App Router và tuân theo cấu trúc của Next.js 16. Trước khi dùng API
  Next.js chưa chắc chắn, đọc tài liệu local theo hướng dẫn trong
  `frontend/AGENTS.md`.
- Mặc định dùng Server Component. Chỉ thêm `"use client"` khi cần state,
  effect, event handler hoặc browser API.
- Đặt page/layout trong `src/app`; component dùng chung trong
  `src/components`; logic dùng chung trong `src/lib` hoặc `src/hooks`.
- Dùng alias `@/*` cho import từ `frontend/src` thay vì chuỗi `../../..` dài.
- Component phải có props type rõ ràng. Không gọi API trực tiếp trong nhiều
  component nếu có thể gom vào một client/service dùng chung.
- Giao diện phải responsive, có trạng thái loading/empty/error và có thể sử
  dụng bằng bàn phím. Ảnh phải có `alt` phù hợp.
- Không hard-code URL backend; dùng `NEXT_PUBLIC_API_URL`.

## 6. Backend

- Mỗi domain NestJS đặt trong module riêng, ví dụ:
  `src/products/products.module.ts`, `products.controller.ts`,
  `products.service.ts`.
- Controller chỉ xử lý HTTP và gọi service; business logic nằm trong service.
- Validate input tại biên hệ thống. Khi có DTO, dùng tên như
  `CreateProductDto`, `UpdateProductDto` và khai báo kiểu đầy đủ.
- Trả về HTTP status và lỗi nhất quán; không trả stack trace hoặc thông tin
  nhạy cảm cho client.
- Không hard-code secret, connection string hay URL môi trường. Đọc từ biến
  môi trường và cập nhật file `.env.example` khi thêm biến mới.
- Viết unit test cho service/logic mới và e2e test cho endpoint quan trọng.

## 7. API contract

- Endpoint dùng danh từ số nhiều, chữ thường, ví dụ `/products`.
- Query parameter và JSON field dùng `camelCase`.
- Thay đổi breaking phải được thông báo và cập nhật đồng thời frontend,
  backend và tài liệu liên quan.
- Giá tiền được biểu diễn bằng số nguyên theo VND, không dùng số thực.
- Ngày giờ trao đổi qua API dùng ISO 8601; backend lưu/xử lý theo UTC.

## 8. Kiểm tra trước khi commit

Chạy các lệnh liên quan đến phần đã thay đổi:

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
npm run lint
npm test
npm run build
```

Nếu một lệnh không chạy được, ghi rõ lệnh, lỗi và lý do trong PR; không bỏ qua
im lặng.

## 9. Git workflow

- Tạo branch mới từ `main` đã cập nhật. Không code trực tiếp trên `main`.
- Tên branch theo mẫu:
  - `feature/<ten-ngan>` cho tính năng.
  - `fix/<ten-ngan>` cho sửa lỗi.
  - `docs/<ten-ngan>` cho tài liệu.
  - `refactor/<ten-ngan>` cho tái cấu trúc không thay đổi hành vi.
- Commit nhỏ, tập trung vào một mục đích. Dùng Conventional Commits:
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Không commit file build, cache, log, file tạm, profile trình duyệt hoặc dữ
  liệu cá nhân.
- Không force-push branch của người khác và không ghi đè thay đổi chưa commit.

## 10. Checklist cho Pull Request

- [ ] Code đúng phạm vi task và không kèm thay đổi ngoài lề.
- [ ] Đã tự review diff và xóa code/debug file tạm.
- [ ] Lint, test và build liên quan đã pass.
- [ ] Có test cho logic mới hoặc đã giải thích lý do chưa có test.
- [ ] Đã cập nhật `.env.example`/tài liệu nếu config hoặc hành vi thay đổi.
- [ ] PR mô tả vấn đề, cách xử lý, cách kiểm tra và ảnh/video nếu đổi UI.
- [ ] Không có secret hay thông tin nhạy cảm trong commit.
