import { useEffect } from "react";
import { formatCurrency } from "../lib/currency";

const ORDER_TYPES = ["Dine-in", "Takeaway", "Delivery"];

export default function CheckoutModal({
  ticketItems,
  ticketOrderType,
  setTicketOrderType,
  deliveryAddress,
  setDeliveryAddress,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  tableNumber,
  setTableNumber,
  ticketSubtotal,
  ticketDeliveryFee,
  onChangeDeliveryFee,
  ticketDiscountAmount,
  onChangeDiscount,
  ticketExtraCharges,
  onChangeExtraCharges,
  ticketTotal,
  memberDiscountPercent,
  isMemberOrder,
  onToggleMember,
  deliverySettings,
  deliveryAreas,
  selectedArea,
  onSelectArea,
  onClose,
  onSendToKitchen,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex animate-[fadeIn_0.15s_ease-out] items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="flex max-h-[90vh] w-full max-w-md animate-[popIn_0.2s_ease-out] flex-col overflow-hidden rounded-2xl border border-cream/10 bg-surface-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-cream/10 p-4">
          <h3 id="checkout-modal-title" className="text-lg font-bold text-cream">Review &amp; Checkout</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* ORDER TYPE */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {ORDER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setTicketOrderType(type)}
                  className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${
                    ticketOrderType === type
                      ? "bg-brand-orange text-white"
                      : "border border-cream/10 bg-surface-input text-text-muted hover:text-cream"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {ticketOrderType === "Delivery" && (
              <div className="flex flex-col gap-2">
                {deliverySettings?.deliveryChargeType === 'area' && deliveryAreas?.length > 0 && (
                  <select
                    value={selectedArea?.id || ''}
                    onChange={(e) => {
                      const area = deliveryAreas.find((a) => a.id === e.target.value);
                      onSelectArea(area || null);
                    }}
                    className="w-full rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-sm text-cream focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
                  >
                    <option value="">-- Select area --</option>
                    {deliveryAreas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name} — Rs {area.charge}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone number..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Delivery address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
                />
              </div>
            )}
            {ticketOrderType === "Dine-in" && (
              <input
                type="text"
                placeholder="Table number (optional)..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none"
              />
            )}
          </div>

          {/* MEMBER */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onToggleMember(false)}
              className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${
                !isMemberOrder
                  ? "bg-brand-orange text-white"
                  : "border border-cream/10 bg-surface-input text-text-muted hover:text-cream"
              }`}
            >
              Non-Member
            </button>
            <button
              type="button"
              onClick={() => onToggleMember(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-bold transition ${
                isMemberOrder
                  ? "bg-brand-teal text-white"
                  : "border border-cream/10 bg-surface-input text-text-muted hover:text-cream"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">card_membership</span>
              Member (-{memberDiscountPercent}%)
            </button>
          </div>

          {/* MANUAL DISCOUNT + DELIVERY FEE -- editable at checkout, before the order even exists */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-cream">Discount Amount</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-text-muted">Rs</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={ticketDiscountAmount ? Number(ticketDiscountAmount.toFixed(2)) : 0}
                  onChange={(e) => onChangeDiscount(e.target.value)}
                  className="w-24 rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-right text-sm font-bold text-cream focus:border-brand-orange focus:outline-none"
                />
              </div>
            </div>
            {ticketOrderType === "Delivery" && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-cream">Delivery Charges</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-text-muted">Rs</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={ticketDeliveryFee ? Number(ticketDeliveryFee.toFixed(2)) : 0}
                    onChange={(e) => onChangeDeliveryFee(e.target.value)}
                    className="w-24 rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-right text-sm font-bold text-cream focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-cream">Extra Charges</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-text-muted">Rs</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={ticketExtraCharges}
                  onChange={(e) => onChangeExtraCharges(e.target.value)}
                  className="w-24 rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-right text-sm font-bold text-cream focus:border-brand-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* BILL PREVIEW */}
          <div className="flex flex-col gap-2 rounded-xl border border-cream/10 bg-surface-input p-3">
            {ticketItems.map((item) => {
              const hasItemDiscount = item.originalPrice > item.itemPrice + 0.01;
              return (
                <div key={item.ticketItemId} className="flex justify-between text-sm">
                  <span className="text-cream">
                    {item.quantity}x {item.product.name}
                    {hasItemDiscount && (
                      <span className="ml-1.5 text-[11px] font-bold text-brand-teal">-{item.discountPercent}%</span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-1.5">
                    {hasItemDiscount && (
                      <span className="text-[11px] text-text-dim line-through">{formatCurrency(item.originalPrice * item.quantity)}</span>
                    )}
                    <span className="text-text-muted">{formatCurrency(item.itemPrice * item.quantity)}</span>
                  </span>
                </div>
              );
            })}
            <div className="mt-1 flex flex-col gap-1 border-t border-dashed border-cream/15 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Items</span>
                <span className="text-cream">{formatCurrency(ticketSubtotal)}</span>
              </div>
              {ticketDiscountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-teal">Discount</span>
                  <span className="text-brand-teal">-{formatCurrency(ticketDiscountAmount)}</span>
                </div>
              )}
              {ticketOrderType === "Delivery" && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Delivery Fee</span>
                  <span className="text-cream">{ticketDeliveryFee > 0 ? formatCurrency(ticketDeliveryFee) : <span className="text-green-400 font-medium">Free</span>}</span>
                </div>
              )}
              {(parseFloat(ticketExtraCharges) || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Extra Charges</span>
                  <span className="text-cream">{formatCurrency(parseFloat(ticketExtraCharges) || 0)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between font-display text-lg text-cream">
                <span>Total (before tax)</span>
                <span className="text-brand-yellow">{formatCurrency(ticketTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-cream/10 p-4">
          <button
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange py-3 text-base font-bold text-white shadow-[0_4px_10px_rgba(255,87,34,0.3)] transition hover:brightness-105 active:scale-[0.98]"
            onClick={onSendToKitchen}
          >
            <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
            Send to Kitchen
          </button>
          <p className="text-center text-xs text-text-muted">
            No payment yet -- sales tax is added once a payment method is picked when the bill is printed, from the Orders tab.
          </p>
        </div>
      </div>
    </div>
  );
}
