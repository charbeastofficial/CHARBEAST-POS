import { useState } from "react";
import { formatCurrency } from "../lib/currency";

export default function QueuedOrderDetail({
  order,
  products,
  categories,
  brokenImageIds,
  markImageBroken,
  onPrintTicket,
  onPrintBill,
  onPreviewBill,
  onClose,
  onConfirm,
  onUpdateStatus,
  onMarkPaid,
  onEditOrder,
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1.5 border-b border-cream/10 bg-brand-yellow/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg text-cream">
            Order #{order.id.slice(-6).toUpperCase()}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                order.isPaid ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-yellow/15 text-brand-yellow"
              }`}
            >
              {order.isPaid ? "Paid" : "Cash on Delivery"}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {["Preparing", "Ready"].includes(order.status) && (
              <>
                <button
                  onClick={() => onPrintTicket(order)}
                  title="Print kitchen ticket"
                  className="flex items-center gap-1 rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-sm text-text-muted transition hover:text-cream"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  KOT
                </button>
                <button
                  onClick={() => onPreviewBill(order)}
                  title="Preview bill receipt"
                  className="flex items-center gap-1 rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-sm text-text-muted transition hover:text-cream"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Preview
                </button>
                <button
                  onClick={() => onPrintBill(order)}
                  title="Print bill (shows the customer what they owe -- doesn't record payment)"
                  className="flex items-center gap-1 rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-sm text-text-muted transition hover:text-cream"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Customer Bill
                </button>
              </>
            )}
            {!order.isPaid && order.status !== "Cancelled" && (
              <button
                onClick={() => onEditOrder(order)}
                title="Edit delivery fee / discount"
                className="flex items-center gap-1 rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-sm text-text-muted transition hover:text-cream"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md border border-cream/10 bg-surface-input px-2.5 py-1 text-sm text-text-muted transition hover:text-cream"
            >
              Close View
            </button>
          </div>
        </div>
        <div className="text-sm text-text-muted">
          Customer: <strong className="text-cream">{order.customerName}</strong> ({order.customerPhone})
          <br />
          Order Type: <strong className="text-cream">{order.orderType}</strong>
          <br />
          {order.orderType === "Delivery" && order.deliveryAddress && (
            <>
              Deliver to: <strong className="text-cream">{order.deliveryAddress}</strong>
              <br />
            </>
          )}
          Created: <strong className="text-cream">{new Date(order.createdAt).toLocaleTimeString()}</strong>
        </div>

        {/* One clear next step at a time -- no skipping ahead, no guesswork. */}
        <div className="mt-2 flex flex-col gap-2">
          {order.status === "Pending" && (
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange py-2.5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,87,34,0.3)] transition hover:brightness-105 active:scale-[0.98]"
              onClick={onConfirm}
            >
              <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
              Confirm &amp; Send to Kitchen
            </button>
          )}
          {["Preparing", "Ready"].includes(order.status) && (
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-green py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
              onClick={() => onMarkPaid(order, "Cash")}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Complete Order (Paid)
            </button>
          )}
          {["Pending", "Preparing", "Ready"].includes(order.status) && (
            <button
              className="rounded-lg border border-brand-red/25 py-1.5 text-xs font-bold text-brand-red transition hover:bg-brand-red/10 active:scale-[0.98]"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {order.items.map((item, idx) => {
          const product = products.find((p) => p.id === item.productId);
          const cat = product ? categories.find((c) => c.id === product.categoryID) : null;
          return (
            <div key={idx} className="flex items-center gap-3 border-b border-cream/5 pb-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-card-high text-xl">
                {product?.imageURL && !brokenImageIds.has(product.id) ? (
                  <img src={product.imageURL} alt={item.name} className="h-full w-full object-cover" onError={() => markImageBroken(product.id)} />
                ) : (
                  <span>{cat ? cat.icon : "🍔"}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-cream">{item.name}</div>
                {item.notes && <div className="mt-0.5 text-xs text-text-muted">+ {item.notes}</div>}
                <div className="mt-0.5 text-xs text-text-muted">
                  Qty: {item.quantity} x {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="font-display min-w-[70px] text-right text-sm font-bold text-brand-yellow">
                {formatCurrency(item.unitPrice * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t-2 border-cream/10 bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Total Amount (Cash on Delivery)</span>
          <strong className="font-display text-xl text-brand-yellow">{formatCurrency(order.totalAmount)}</strong>
        </div>
        {order.status === "Completed" && (
          <>
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg border border-cream/10 bg-surface-card-highest py-2.5 text-sm font-bold text-cream transition hover:bg-cream/10"
              onClick={() => onPreviewBill(order)}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Preview
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg border border-cream/10 bg-surface-card-highest py-2.5 text-sm font-bold text-cream transition hover:bg-cream/10"
              onClick={() => onPrintBill(order)}
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Reprint Customer Bill
            </button>
          </>
        )}
      </div>

      {/* Cancel reason modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}>
          <div className="w-full max-w-[400px] rounded-2xl border border-cream/10 bg-surface-elevated p-6 shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold text-cream">Cancel Order</h2>
            <p className="mb-4 text-sm text-text-muted">Why is this order being cancelled? (shown to customer)</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Out of stock, customer request, etc."
              className="mb-5 w-full rounded-xl border border-cream/10 bg-surface-input p-3 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className="rounded-xl border border-cream/10 bg-cream/5 px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-cream/20 hover:text-cream"
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
              >
                Back
              </button>
              <button
                type="button"
                className="rounded-xl bg-brand-red px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-red/20 transition hover:brightness-110"
                onClick={() => {
                  onUpdateStatus("Cancelled", cancelReason);
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
