"use client";

import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/api.types";

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const defaultSize =
    product.sizes.find((size) => size.size === "M") ??
    product.sizes.find((size) => size.size === "S") ??
    product.sizes[0];
  const selectedSize = defaultSize?.size ?? "S";
  const price = product.basePrice + (defaultSize?.additionalPrice ?? 0);

  return (
    <article className={`figma-product-card${product.isOutOfStock ? " is-sold-out" : ""}`}>
      <div className="figma-product-card__image-wrap">
        <Image
          className="figma-product-card__image"
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 430px) 43vw, 170px"
        />
        {product.isOutOfStock && <span>Hết hàng</span>}
      </div>
      <div className="figma-product-card__body">
        <h2>{product.name}</h2>
        <strong>{formatPrice(price)}</strong>
        <button
          type="button"
          disabled={product.isOutOfStock}
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              size: selectedSize,
              unitPrice: price,
            })
          }
        >
          {product.isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </article>
  );
}
