# BrewLite

BrewLite là ứng dụng đặt đồ uống không tiền mặt, xây dựng bằng Next.js,
NestJS, PostgreSQL và Prisma.

## Yêu cầu môi trường

- Docker (chạy toàn bộ bằng `docker compose`), hoặc
- Node.js 24, npm và PostgreSQL (chạy từng phần trên máy)

## Chạy bằng Docker

Cách nhanh nhất để chạy đủ frontend, backend và PostgreSQL:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

Lần đầu chạy, backend tự áp dụng migration và nạp dữ liệu mẫu (chỉ khi
database chưa có sản phẩm, nên khởi động lại không làm mất tồn kho). Các giá
trị mặc định lấy theo `.env.example`; muốn đổi mật khẩu database hoặc
`JWT_SECRET`, sao chép `.env.example` thành `.env` ở thư mục gốc trước khi chạy.
Xóa dữ liệu và chạy lại từ đầu bằng `docker compose down -v`.

`NEXT_PUBLIC_API_URL` được nhúng vào frontend lúc build, nên khi đổi giá trị
này cần chạy lại `docker compose up --build`.

## Chạy dự án không dùng Docker

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

## Luồng đặt hàng và thanh toán

1. Thêm món vào giỏ, bấm **Đặt hàng**. Chưa đăng nhập thì ứng dụng chuyển tới
   `/login` và quay lại giỏ hàng sau khi đăng nhập.
2. Backend tạo đơn `PENDING` (mã `CC-xxxxxx`), tính giá ở server, áp mã giảm
   giá và trừ kho. Trang **Đơn hàng của bạn** (`/checkout/[id]`) hiện tóm tắt đơn
   và thời gian còn lại để thanh toán.
3. Đơn chưa thanh toán sau 15 phút bị tự động hủy (scheduler chạy mỗi phút):
   hoàn kho, trả lượt mã giảm giá và hiện màn **Đơn đã tự động hủy**.
4. **VNPay (khuyên dùng)**: khách được chuyển sang cổng VNPay, nhập thẻ hoặc quét
   QR ở đó, rồi VNPay báo kết quả về backend. Kết quả do VNPay xác nhận, ứng dụng
   không tự quyết định (xem mục *Thanh toán qua VNPay*). Các cách còn lại bên
   dưới chỉ là giả lập ngay trong backend:
   - **Ví điện tử**: thành công ngay.
   - **Thẻ**: số thẻ phải đủ 16 chữ số. Thẻ thử nghiệm `4000 0000 0000 0002`
     luôn bị từ chối để demo màn thanh toán thất bại; các số khác thành công.
   - **QR**: mã có hiệu lực 15 phút, bấm **Tôi đã chuyển khoản** để giả lập
     ngân hàng xác nhận. Mã hết hạn thì tạo mã mới.
5. Thanh toán thành công chuyển đơn sang `PAID` và cộng 1 điểm thưởng cho mỗi
   10.000đ. Thất bại chuyển đơn sang `PAYMENT_FAILED`, có thể thanh toán lại.
6. Hủy đơn đã thanh toán sẽ hoàn tiền (`REFUNDED`) và trừ lại điểm thưởng.

## API đơn hàng và thanh toán

Các API dưới đây cần header `Authorization: Bearer <accessToken>` lấy từ
`POST /auth/login`.

```http
POST /orders                 # tạo đơn: { items: [{ productId, size, quantity }], discountCode? }
GET  /orders/me              # đơn của tôi, lọc bằng ?status=PENDING|PAID|...
GET  /orders/:id             # chi tiết đơn kèm lịch sử trạng thái
POST /orders/:id/cancel      # hủy đơn: hoàn kho, hoàn tiền, trừ điểm, trả mã giảm giá
POST /payments               # { orderId, method: VNPAY|WALLET|CARD|QR, idempotencyKey, cardNumber? }
GET  /payments/:id           # kết quả một thanh toán (chỉ chủ đơn xem được)
POST /payments/:id/confirm   # giả lập xác nhận chuyển khoản QR
GET  /payments/vnpay/return  # VNPay đưa trình duyệt của khách về (xác minh chữ ký)
GET  /payments/vnpay/ipn     # VNPay gọi server-to-server (xác minh chữ ký)
```

Gửi lại `POST /payments` với cùng `idempotencyKey` chỉ trả về thanh toán đã
tạo, không tạo thanh toán mới.

## Thanh toán qua VNPay

Với `method: VNPAY`, backend tạo thanh toán chờ xử lý và trả về `paymentUrl` đã ký
(HMAC-SHA512) để chuyển khách sang cổng VNPay. Đơn chỉ chuyển sang `PAID` hoặc
`PAYMENT_FAILED` khi VNPay gửi kết quả về `/payments/vnpay/return` (trình duyệt
của khách) hoặc `/payments/vnpay/ipn` (máy chủ VNPay). Backend luôn kiểm tra chữ
ký, đối chiếu số tiền với database và xử lý idempotent nên hai đường gửi trùng
nhau không cộng điểm hai lần.

### Cấu hình
1. Đăng ký merchant môi trường test tại https://sandbox.vnpayment.vn/devreg/ để
   nhận `TmnCode` và `HashSecret` qua email.
2. Sao chép `.env.example` thành `.env` ở thư mục gốc (dùng cho Docker) và
   `backend/.env.example` thành `backend/.env` (chạy không dùng Docker), rồi điền:

```env
VNPAY_TMN_CODE=<TmnCode nhận qua email>
VNPAY_HASH_SECRET=<HashSecret nhận qua email>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/payments/vnpay/return
```

`HashSecret` là khóa bí mật: chỉ để trong `.env` (đã nằm trong `.gitignore`),
không commit và không gửi vào nơi công khai. Thiếu cấu hình thì chọn VNPay sẽ báo
"Cổng thanh toán VNPay chưa được cấu hình". Sau khi đổi `.env`, chạy lại
`docker compose up --build`.

### Thẻ thử nghiệm của VNPay
Trên trang VNPay chọn thanh toán bằng thẻ nội địa, ngân hàng **NCB**, rồi nhập:

| Trường | Giá trị |
|---|---|
| Số thẻ | `9704198526191432198` |
| Tên chủ thẻ | `NGUYEN VAN A` |
| Ngày phát hành | `07/15` |
| Mật khẩu OTP | `123456` |

Bấm **Hủy** trên trang VNPay để demo giao dịch thất bại.

### IPN
- Return URL chạy được ngay trên máy local, nên demo không cần IPN.
- Để VNPay gọi IPN thật, backend cần địa chỉ công khai (ví dụ dùng ngrok:
  `ngrok http 3001`). Gửi địa chỉ `https://<tên-miền-công-khai>/payments/vnpay/ipn`
  cho VNPay trong trang quản trị merchant (https://sandbox.vnpayment.vn/merchantv2/).
- Nếu đơn đã bị hủy (quá 15 phút) trong lúc khách thanh toán xong ở VNPay,
  thanh toán được ghi nhận `FAILED` kèm lý do và cần hoàn tiền thủ công từ
  trang quản trị VNPay; ứng dụng chưa gọi API hoàn tiền của VNPay.

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
