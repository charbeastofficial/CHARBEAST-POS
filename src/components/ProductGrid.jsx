import { formatCurrency } from "../lib/currency";

export default function ProductGrid({
  loading,
  activeCategory,
  deals,
  products,
  categories,
  brokenImageIds,
  markImageBroken,
  onProductClick,
  onDealAdd,
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden border-r border-cream/10 bg-surface">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            <LoadingSkeleton />
          </div>
        ) : activeCategory === "deals" ? (
          deals.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">No active deals right now.</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {deals.map((deal, i) => (
                <DealCard key={deal.id} deal={deal} index={i} broken={brokenImageIds.has(deal.id)} onBroken={() => markImageBroken(deal.id)} onClick={() => onDealAdd(deal)} />
              ))}
            </div>
          )
        ) : products.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">No products in this category.</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {products.map((product, i) => {
              const cat = categories.find((c) => c.id === product.categoryID);
              // If this category (often a subcategory) has no image of its
              // own, fall back to the parent category's image instead of
              // leaving the product with no themed placeholder at all.
              const parentCat = cat && !cat.imageURL ? categories.find((c) => c.id === cat.parentId) : null;
              const catWithImage = parentCat?.imageURL ? { ...cat, imageURL: parentCat.imageURL } : cat;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={catWithImage}
                  index={i}
                  imageBroken={brokenImageIds.has(product.id)}
                  categoryImageBroken={brokenImageIds.has(`cat-${cat?.id}`)}
                  onImageBroken={() => markImageBroken(product.id)}
                  onCategoryImageBroken={() => markImageBroken(`cat-${cat?.id}`)}
                  onClick={() => onProductClick(product)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return Array.from({ length: 10 }).map((_, i) => (
    <div
      key={i}
      style={{ animationDelay: `${i * 40}ms` }}
      className="flex animate-[popIn_0.3s_ease-out_backwards] flex-col overflow-hidden rounded-xl border border-cream/10 bg-surface-card"
    >
      <div className="aspect-square w-full animate-pulse bg-surface-card-high" />
      <div className="flex flex-col gap-1.5 p-2.5">
        <div className="h-3 w-4/5 animate-pulse rounded bg-surface-card-high" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-surface-card-high" />
      </div>
    </div>
  ));
}

function DealCard({ deal, index, broken, onBroken, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex animate-[popIn_0.3s_ease-out_backwards] flex-col overflow-hidden rounded-xl border border-cream/10 bg-surface-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-b from-brand-yellow/15 to-surface-card-high">
        {deal.imageURL && !broken ? (
          <img src={deal.imageURL} alt={deal.title} className="h-full w-full object-cover" onError={onBroken} />
        ) : (
          <span className="text-4xl">🔥</span>
        )}
        {deal.badge && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-brand-yellow px-1.5 py-0.5 text-[9px] font-bold text-white">{deal.badge}</span>
        )}
        <span className="absolute right-1.5 bottom-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-white shadow transition group-hover:scale-110 group-active:scale-95">
          <span className="material-symbols-outlined text-lg">add</span>
        </span>
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <div className="truncate text-xs font-semibold text-cream">{deal.title}</div>
        <span className="font-display text-xs font-bold text-brand-yellow">{formatCurrency(deal.price)}</span>
      </div>
    </button>
  );
}

function ProductCard({ product, category, index, imageBroken, categoryImageBroken, onImageBroken, onCategoryImageBroken, onClick }) {
  const discount = product.discountPercent > 0 ? product.discountPercent : (category?.discountPercent || 0);
  const discountedPrice = discount > 0 ? product.basePrice * (1 - discount / 100) : null;

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className={`group flex animate-[popIn_0.3s_ease-out_backwards] flex-col overflow-hidden rounded-xl border border-cream/10 bg-surface-card text-left shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        product.isAvailable ? "hover:-translate-y-0.5 hover:border-brand-orange/40 hover:shadow-md" : "cursor-not-allowed opacity-60"
      }`}
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-b from-brand-orange/5 to-surface-card-high">
        {product.imageURL && !imageBroken ? (
          <img src={product.imageURL} alt={product.name} className="h-full w-full object-cover" onError={onImageBroken} />
        ) : category?.imageURL && !categoryImageBroken ? (
          <img src={category.imageURL} alt={product.name} className="h-full w-full object-cover" onError={onCategoryImageBroken} />
        ) : (
          <span className="text-4xl">{category ? category.icon : "🍔"}</span>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-card/85">
            <span className="rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-bold text-white">OUT OF STOCK</span>
          </div>
        )}
        {product.isAvailable && (
          <>
            {discount > 0 && (
              <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-brand-red px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-md">
                -{discount}%
              </span>
            )}
            <span className="absolute right-1.5 bottom-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-white shadow transition group-hover:scale-110 group-active:scale-95">
              <span className="material-symbols-outlined text-lg">add</span>
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <div className="truncate text-xs font-semibold text-cream">{product.name}</div>
        {discountedPrice ? (
          <div className="flex items-center gap-1">
            <span className="font-display text-[10px] font-semibold text-text-muted line-through">{formatCurrency(product.basePrice)}</span>
            <span className="font-display text-xs font-bold text-brand-yellow">{formatCurrency(discountedPrice)}</span>
          </div>
        ) : (
          <span className="font-display text-xs font-bold text-brand-yellow">{formatCurrency(product.basePrice)}</span>
        )}
      </div>
    </button>
  );
}