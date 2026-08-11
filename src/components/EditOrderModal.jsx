import { useState } from "react";
import { formatCurrency } from "../lib/currency";
import { resolveTaxRate } from "../db";

const STEP = 50;

function StepperInput({ value, onChange, min = 0, max = 999999, step = STEP }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(String(clamp((parseFloat(value) || 0) - step)))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream/10 bg-surface-input text-lg font-bold text-text-muted transition hover:text-cream active:scale-95"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-lg border border-cream/10 bg-surface-input px-3 py-1.5 text-center text-sm font-bold text-cream focus:border-brand-orange focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(String(clamp((parseFloat(value) || 0) + step)))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream/10 bg-surface-input text-lg font-bold text-text-muted transition hover:text-cream active:scale-95"
      >
        +
      </button>
    </div>
  );
}

export default function EditOrderModal({ order, siteSettings, onSave, onClose }) {
  const [deliveryFee, setDeliveryFee] = useState(String(order.deliveryFee || 0));
  const [discount, setDiscount] = useState(String(order.discountAmount || 0));
  const [extraCharges, setExtraCharges] = useState(String(order.extraCharges || 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const itemsSum = order.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  const newDiscount = parseFloat(discount) || 0;
  const newDeliveryFee = parseFloat(deliveryFee) || 0;
  const newExtraCharges = parseFloat(extraCharges) || 0;

  const taxRate = order.paymentMethod
    ? resolveTaxRate(siteSettings, order.paymentMethod)
    : 0;
  const taxed = order.paymentMethod;
  const discountedSubtotal = Math.max(0, itemsSum - newDiscount);
  const total = taxed
    ? discountedSubtotal * (1 + taxRate) + newDeliveryFee + newExtraCharges
    : discountedSubtotal + newDeliveryFee + newExtraCharges;

  const handleSave = async () => {
    if (newDiscount < 0 || newDeliveryFee < 0 || newExtraCharges < 0) {
      setError("Values cannot be negative.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ deliveryFee: newDeliveryFee, discountAmount: newDiscount, extraCharges: newExtraCharges });
    } catch (err) {
      console.error("Error updating order:", err);
      setError("Failed to save changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-cream/10 bg-surface-elevated shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-cream/10 p-4">
          <div>
            <h2 className="text-lg font-bold text-cream">Edit Order #{order.id.slice(-6).toUpperCase()}</h2>
            <p className="text-xs text-text-muted">Adjust delivery charges, discount and extra charges before the order is paid.</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-cream/10 bg-surface-input px-2 py-1 text-sm text-text-muted transition hover:text-cream">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4 rounded-xl border border-cream/10 bg-surface-card p-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-muted">{item.quantity}× {item.name}</span>
                <span className="text-cream">{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-cream/10 pt-2 text-sm">
              <span className="text-text-muted">Items Subtotal</span>
              <span className="font-bold text-cream">{formatCurrency(itemsSum)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cream">Delivery Charges</div>
                <div className="text-[11px] text-text-muted">Only applies to delivery orders.</div>
              </div>
              <StepperInput value={deliveryFee} onChange={setDeliveryFee} step={10} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cream">Discount Amount</div>
                <div className="text-[11px] text-text-muted">Add or reduce the discount on this order.</div>
              </div>
              <StepperInput value={discount} onChange={setDiscount} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cream">Extra Charges</div>
                <div className="text-[11px] text-text-muted">e.g. packaging, service fee.</div>
              </div>
              <StepperInput value={extraCharges} onChange={setExtraCharges} step={10} />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1 rounded-xl border border-cream/10 bg-surface-card p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Subtotal after discount</span>
              <span className="text-cream">{formatCurrency(discountedSubtotal)}</span>
            </div>
            {taxed && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span className="text-cream">{formatCurrency(discountedSubtotal * taxRate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Delivery charges</span>
              <span className="text-cream">{formatCurrency(newDeliveryFee)}</span>
            </div>
            {newExtraCharges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Extra charges</span>
                <span className="text-cream">{formatCurrency(newExtraCharges)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-cream/10 pt-2">
              <span className="font-semibold text-cream">New Total</span>
              <span className="font-display text-lg font-bold text-brand-yellow">{formatCurrency(total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-brand-red">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-cream/10 bg-surface-card p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-cream/10 bg-cream/5 px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-cream/20 hover:text-cream"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-yellow px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-yellow/20 transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
