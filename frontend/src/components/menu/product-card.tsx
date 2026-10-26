import Image from "next/image";
import type { Product } from "@/lib/api.types";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className={`product-card${product.isOutOfStock ? " product-card--sold-out" : ""}`}
    >
      <div className="product-card__image-wrap">
        <Image
          className="product-card__image"
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <span className="product-card__category">{product.category.name}</span>
        {product.isOutOfStock && (
          <span className="product-card__stock">Hết hàng</span>
        )}
      </div>
      <div className="product-card__body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>
        <div className="product-card__footer">
          <div>
            <span className="price-label">Từ</span>
            <strong>{currencyFormatter.format(product.price)}</strong>
          </div>
          <div className="size-list" aria-label="Kích cỡ có sẵn">
            {product.sizes.map((size) => (
              <span key={size.size}>{size.size}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
