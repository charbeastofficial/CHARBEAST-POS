import { formatCurrency } from "../lib/currency";
import StatusPill from "./StatusPill";

const ORDER_TYPE_ICON = {
  Delivery: "two_wheeler",
  "Dine-in": "storefront",
  Takeaway: "directions_walk",
};

export default function QueueView({ orders, flashingOrders, onSelectOrder }) {
  return (
    <div key="queue" className="flex min-h-0 flex-1 flex-col overflow-hidden animate-[fadeIn_0.25s_ease-out]">
      <div className="flex items-center gap-2 border-b border-cream/10 bg-surface-elevated px-5 py-3">
        <span className="material-symbols-outlined text-brand-orange text-lg">notifications</span>
        <h2 className="text-sm font-bold text-cream">Online Orders Queue</h2>
        <span className="rounded-md bg-brand-orange/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">{orders.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-cream/15 py-20 text-center text-text-muted">
            <span className="material-symbols-outlined animate-[float_3s_ease-in-out_infinite] text-3xl opacity-50">check_circle</span>
            <p className="text-xs">No incoming website orders waiting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {orders.map((order, i) => {
              const isNew = flashingOrders.includes(order.id);
              return (
                <button
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  style={{ animationDelay: isNew ? "0ms" : `${Math.min(i, 12) * 30}ms` }}
                  className={`flex animate-[popIn_0.3s_ease-out_backwards] flex-col gap-2 rounded-xl border bg-surface-card p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange hover:shadow-md active:scale-[0.98] ${
                    isNew ? "border-brand-orange [animation:popIn_0.3s_ease-out,glowPulse_1.6s_ease-in-out_infinite]" : "border-cream/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-cream">#{order.id.slice(-6).toUpperCase()}</span>
                    <StatusPill status={order.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-cream">{order.customerName}</span>
                    <span className="font-display shrink-0 text-base font-bold text-brand-yellow">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="material-symbols-outlined text-[12px]">{ORDER_TYPE_ICON[order.orderType] || "receipt_long"}</span>
                    {order.orderType}
                    <span className="text-text-dim">·</span>
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    <span className="text-text-dim">·</span>
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}