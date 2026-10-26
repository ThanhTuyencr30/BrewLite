import Image from "next/image";
import type { Product } from "@/lib/api.types";

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

export function ProductCard({ product }: { product: Product }) {
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
        <strong>{formatPrice(product.price)}</strong>
        <button type="button" disabled={product.isOutOfStock}>
          {product.isOutOfStock ? "Hết hàng" : "Xem chi tiết"}
        </button>
      </div>
    </article>
  );
}
