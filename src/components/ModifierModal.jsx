import { useEffect } from "react";
import { formatCurrency } from "../lib/currency";
import { sizeAbbreviation } from "../lib/sizeLabel";

export default function ModifierModal({ product, selectedSize, selectedModifiers, selectedAddons, onSelectSize, onToggleModifier, onToggleAddon, onClose, onAdd, total }) {
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasAddons = product.addons && product.addons.length > 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[fadeIn_0.15s_ease-out] items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modifier-modal-title"
        className="relative w-full max-w-[420px] animate-[popIn_0.2s_ease-out] rounded-2xl border border-cream/10 bg-surface-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-cream/5 text-text-muted transition hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <h2 id="modifier-modal-title" className="mb-1 pr-9 text-xl text-cream">Add Modifiers</h2>
        <p className="mb-4 text-sm text-text-muted">{product.name}</p>

        {hasSizes && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold tracking-wider text-text-muted uppercase">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const isActive = selectedSize?.id === size.id;
                return (
                  <button
                    type="button"
                    key={size.id}
                    onClick={() => onSelectSize(size)}
                    title={`${size.name} — ${formatCurrency(size.price)}`}
                    aria-label={`${size.name} — ${formatCurrency(size.price)}`}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                      isActive ? "border-brand-orange bg-brand-orange text-white" : "border-cream/10 bg-surface-input text-cream hover:border-cream/20"
                    }`}
                  >
                    {sizeAbbreviation(size.name)}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              {selectedSize ? `${selectedSize.name} — ${formatCurrency(selectedSize.price)}` : "Tap a size"}
            </p>
          </div>
        )}

        {product.modifiers.length > 0 && (
          <>
            <p className="mb-2 text-xs font-bold tracking-wider text-text-muted uppercase">Extras</p>
            <div className="mb-5 flex flex-col gap-2">
              {product.modifiers.map((mod) => {
                const isActive = selectedModifiers.some((m) => m.name === mod.name);
                return (
                  <button
                    type="button"
                    key={mod.name}
                    onClick={() => onToggleModifier(mod)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                      isActive ? "border-brand-orange/40 bg-brand-orange/10" : "border-cream/10 bg-surface-input hover:border-cream/20"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm text-cream">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                          isActive ? "border-brand-orange bg-brand-orange" : "border-text-dim"
                        }`}
                      >
                        {isActive && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {mod.name}
                    </span>
                    <span className="text-sm font-semibold text-brand-yellow">+{formatCurrency(mod.price)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {hasAddons && (
          <>
            <p className="mb-2 text-xs font-bold tracking-wider text-text-muted uppercase">Add-ons (Optional)</p>
            <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {product.addons.map((addon) => {
                const isActive = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    type="button"
                    key={addon.id}
                    onClick={() => onToggleAddon(addon)}
                    className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                      isActive ? "border-brand-orange/40 bg-brand-orange/10" : "border-cream/10 bg-surface-input hover:border-cream/20"
                    }`}
                  >
                    <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface-card-highest">
                      {addon.imageURL ? (
                        <img src={addon.imageURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-lg text-text-muted">add_circle</span>
                      )}
                      {isActive && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-[11px] font-semibold text-cream">{addon.name}</span>
                    <span className="text-[10px] font-bold text-brand-yellow">+{formatCurrency(addon.price)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-cream/10 pt-4">
          <div>
            <span className="text-sm text-text-muted">Total</span>
            <h3 className="font-display text-xl text-brand-yellow">{formatCurrency(total)}</h3>
          </div>
          <button
            type="button"
            className="rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            onClick={onAdd}
          >
            Add To Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
