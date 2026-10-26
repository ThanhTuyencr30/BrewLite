const SKELETON_ITEMS = Array.from({ length: 8 }, (_, index) => index);

export function MenuSkeleton() {
  return (
    <section className="menu-content" aria-label="Đang tải menu" aria-busy="true">
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--subtitle" />
      <div className="category-list skeleton-categories">
        {SKELETON_ITEMS.slice(0, 5).map((item) => (
          <div className="skeleton-pill" key={item} />
        ))}
      </div>
      <div className="product-grid">
        {SKELETON_ITEMS.map((item) => (
          <article className="product-card product-card--skeleton" key={item}>
            <div className="skeleton-image" />
            <div className="product-card__body">
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--medium" />
            </div>
          </article>
        ))}
      </div>
      <span className="sr-only">Đang tải danh sách sản phẩm</span>
    </section>
  );
}
