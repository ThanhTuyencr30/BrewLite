const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index);

export function MenuSkeleton() {
  return (
    <main className="coffee-app figma-loading-screen" aria-label="Đang tải menu" aria-busy="true">
      <div className="figma-loading-heading">
        <div className="figma-skeleton-line figma-skeleton-line--brand" />
        <div className="figma-skeleton-line figma-skeleton-line--subtitle" />
        <div className="figma-skeleton-line figma-skeleton-line--heading" />
      </div>
      <section className="figma-skeleton-grid">
        {SKELETON_ITEMS.map((item) => (
          <article className="figma-skeleton-card" key={item}>
            <div className="figma-skeleton-image" />
            <div className="figma-skeleton-line figma-skeleton-line--title" />
            <div className="figma-skeleton-line figma-skeleton-line--price" />
            <div className="figma-skeleton-button" />
          </article>
        ))}
      </section>
      <span className="sr-only">Đang tải danh sách sản phẩm</span>
    </main>
  );
}
