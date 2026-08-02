import { formatCurrency } from "../lib/currency";

export default function TicketPanel({
  ticketItems,
  categories,
  brokenImageIds,
  markImageBroken,
  expandedNoteId,
  setExpandedNoteId,
  updateTicketQty,
  updateTicketItemNote,
  clearTicket,
  ticketTotal,
  onCheckout,
}) {
  const itemCount = ticketItems.reduce((a, c) => a + c.quantity, 0);

  return (
    <div className="flex h-full flex-col bg-surface-card-high">
      <div className="flex items-center justify-between border-b border-cream/10 px-4 py-3">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-cream">
          <span className="material-symbols-outlined text-brand-orange text-lg">receipt_long</span>
          My Order
        </h2>
        {itemCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-orange/15 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <button onClick={clearTicket} className="text-[10px] font-semibold text-text-dim transition hover:text-brand-red">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3">
        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-text-muted">
            <span className="material-symbols-outlined text-3xl opacity-40">shopping_cart</span>
            <p className="text-xs">Ticket is empty</p>
            <p className="text-[10px] text-text-dim">Tap items to add them here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ticketItems.map((item) => {
              const cat = categories.find((c) => c.id === item.product.categoryID);
              return (
                <div key={item.ticketItemId} className="flex flex-col gap-1.5 rounded-xl bg-surface-card px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-card-high text-base">
                      {item.product.imageURL && !brokenImageIds.has(item.product.id) ? (
                        <img
                          src={item.product.imageURL}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          onError={() => markImageBroken(item.product.id)}
                        />
                      ) : (
                        <span>{cat ? cat.icon : "🍔"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-cream">{item.product.name}</div>
                      <div className="text-[10px] text-text-muted">
                        <span className={item.discountPercent > 0 ? "line-through opacity-60" : ""}>{formatCurrency(item.originalPrice)}</span>
                        {item.discountPercent > 0 && <> <span className="text-brand-yellow">{formatCurrency(item.itemPrice)}</span></>}
                        {item.size && <> · {item.size.name}</>}
                        {[...item.modifiers, ...item.addons].length > 0 && (
                          <> · {[...item.modifiers, ...item.addons].map((m) => m.name).join(", ")}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-lg bg-surface-card-high p-0.5">
                      <button
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition active:scale-90 hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                        onClick={() => updateTicketQty(item.ticketItemId, -1)}
                      >
                        <span className="material-symbols-outlined text-lg">remove</span>
                      </button>
                      <span key={item.quantity} className="font-display w-6 animate-[popIn_0.15s_ease-out] text-center text-sm text-cream">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition active:scale-90 hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                        onClick={() => updateTicketQty(item.ticketItemId, 1)}
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                  </div>
                  {expandedNoteId === item.ticketItemId ? (
                    <input
                      type="text"
                      autoFocus
                      value={item.note}
                      onChange={(e) => updateTicketItemNote(item.ticketItemId, e.target.value)}
                      onBlur={() => setExpandedNoteId(null)}
                      placeholder="Order note..."
                      className="w-full rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-[10px] text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedNoteId(item.ticketItemId)}
                      className="self-start truncate text-[10px] text-text-dim transition hover:text-brand-orange"
                    >
                      {item.note?.trim() ? `📝 ${item.note}` : "+ Add note"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="flex flex-col gap-2.5 border-t-2 border-cream/10 bg-surface-card px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total</span>
            <span className="font-display text-lg text-brand-yellow">{formatCurrency(ticketTotal)}</span>
          </div>
          <button
            className="rounded-lg bg-brand-orange py-2.5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,87,34,0.3)] transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            onClick={onCheckout}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}