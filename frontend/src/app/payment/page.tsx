import Link from "next/link";
import PaymentFlow from "@/components/payment/payment-flow";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const orderId = readParam(params.orderId);
  // Số tiền chỉ để hiển thị; backend luôn tính theo tổng tiền của đơn hàng.
  const amount = Number(readParam(params.amount));
  const orderCode = readParam(params.code);

  if (!orderId || !UUID_PATTERN.test(orderId)) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-[#F5EBE1] text-[#4a3b32] p-6 flex flex-col items-center justify-center text-center gap-4">
        <h1 className="text-lg font-bold">Không tìm thấy đơn hàng cần thanh toán</h1>
        <p className="text-sm text-gray-500">
          Vui lòng đặt hàng từ giỏ hàng trước khi thanh toán.
        </p>
        <Link
          className="px-6 py-3 rounded-xl bg-[#c08d60] text-white font-bold"
          href="/cart"
        >
          Về giỏ hàng
        </Link>
      </main>
    );
  }

  return (
    <PaymentFlow
      orderId={orderId}
      orderCode={orderCode}
      amount={Number.isInteger(amount) && amount > 0 ? amount : 0}
    />
  );
}
