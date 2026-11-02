"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductDetailScreen, type ProductSelection } from "@/components/product-detail";
import { useCart } from "@/components/cart/cart-provider";
import {
  AppShell,
  Button,
  Card,
  InlineBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { getProductDetails, getToppings } from "@/lib/catalog";
import type { ProductDetails, Topping } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <ProductDetailContent />
    </Suspense>
  );
}

type ProductLoadResult =
  | {
      requestKey: string;
      status: "success";
      product: ProductDetails;
      toppings: Topping[];
    }
  | { requestKey: string; status: "error"; message: string };

function ProductDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, itemCount } = useCart();
  const [result, setResult] = useState<ProductLoadResult | null>(null);
  const [retry, setRetry] = useState(0);
  const [added, setAdded] = useState<ProductSelection | null>(null);
  const requestKey = `${id}:${retry}`;

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getProductDetails(id, controller.signal),
      getToppings(controller.signal),
    ])
      .then(([loadedProduct, loadedToppings]) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          status: "success",
          product: loadedProduct,
          toppings: loadedToppings,
        });
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          status: "error",
          message:
            requestError instanceof Error
              ? requestError.message
              : "Không thể tải thông tin sản phẩm.",
        });
      });

    return () => controller.abort();
  }, [id, requestKey]);

  const addToCart = useCallback((selection: ProductSelection) => {
    const product = result?.status === "success" ? result.product : null;
    if (!product) return;

    addItem({
      productId: selection.productId,
      name: selection.productName,
      imageUrl: product.imageUrl,
      size: selection.size,
      unitPrice: product.sizePrices[selection.size],
      quantity: selection.quantity,
      iceLevel:
        selection.ice === "normal"
          ? "NORMAL"
          : selection.ice === "less"
            ? "LESS"
            : "NONE",
      toppings: selection.toppings,
    });
    setAdded(selection);
  }, [addItem, result]);

  const currentResult =
    result?.requestKey === requestKey ? result : null;

  if (currentResult?.status === "error") {
    return (
      <AppShell>
        <PageHeader onBack={() => router.push("/")} title="Chi tiết sản phẩm" />
        <InlineBanner tone="danger">{currentResult.message}</InlineBanner>
        <Button
          className="mt-4"
          onClick={() => setRetry((value) => value + 1)}
          variant="secondary"
        >
          Thử tải lại
        </Button>
      </AppShell>
    );
  }

  if (!currentResult || currentResult.status !== "success") return <ProductDetailLoading />;

  return (
    <>
      <ProductDetailScreen
        itemCount={itemCount}
        onAddToCart={addToCart}
        onBack={() => router.push("/")}
        product={currentResult.product}
        toppings={currentResult.toppings}
      />
      {added ? (
        <div className="fixed inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <p
            aria-live="polite"
            className="flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg"
          >
            Đã thêm {added.quantity} × {added.productName} ({added.size}) ·{" "}
            {formatCurrency(added.totalPrice)}
            <Link className="font-bold underline" href="/cart">
              Xem giỏ
            </Link>
          </p>
        </div>
      ) : null}
    </>
  );
}

function ProductDetailLoading() {
  return (
    <AppShell>
      <PageHeader title="Chi tiết sản phẩm" />
      <div aria-busy="true" aria-label="Đang tải sản phẩm" role="status">
        <Card className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="size-28 shrink-0" />
            <div className="flex flex-1 flex-col justify-center gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    </AppShell>
  );
}
