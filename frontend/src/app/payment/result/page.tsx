import PaymentResult from "@/components/payment/payment-result";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <PaymentResult
      paymentId={readParam(params.paymentId)}
      hasError={readParam(params.error) !== undefined}
    />
  );
}
