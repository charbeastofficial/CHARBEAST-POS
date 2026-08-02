import { useEffect } from 'react';
import { formatCurrency } from '../lib/currency';
import logoUrl from '../assets/logo.png';

export default function ReceiptPreviewModal({ order, taxRate, onClose }) {
  const originalSubtotal = order.items.reduce((sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity, 0);
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const productDiscount = Math.max(0, originalSubtotal - subtotal);
  const memberDiscount = order.discountAmount || 0;
  const deliveryFee = order.deliveryFee || 0;
  const taxableAmount = subtotal - memberDiscount;
  const tax = Number((taxableAmount * taxRate).toFixed(2));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="receipt-modal-title" className="border-b border-gray-200 px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
          Receipt Preview
        </div>

        <div className="bg-white p-5 font-mono text-xs leading-relaxed text-black">
          <div className="mb-3 text-center">
            <img src={logoUrl} alt="CHARBEAST" className="mx-auto mb-2 h-20 w-20 object-contain" />
            <div className="font-display text-lg tracking-wider">CHARBEAST</div>
            <div className="mt-0.5 text-xs font-bold tracking-wider text-gray-600">CUSTOMER RECEIPT</div>
            <div className="text-gray-500">Main PWD Road, Islamabad</div>
            <div className="text-gray-500">0333-0335336</div>
          </div>
          <div className="mb-2 border-t border-dashed border-gray-300" />

          <div className="mb-1 flex justify-between">
            <span className="text-gray-500">Order:</span>
            <span className="font-bold">#{order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          {order.customerName && order.customerName !== 'Walk-In Customer' && (
            <div className="mb-1 flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span>{order.customerName}</span>
            </div>
          )}
          <div className="mb-1 flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span>{order.orderType}</span>
          </div>
          {order.orderType === 'Dine-in' && order.tableNumber && (
            <div className="mb-1 flex justify-between">
              <span className="text-gray-500">Table:</span>
              <span className="font-bold">{order.tableNumber}</span>
            </div>
          )}
          {order.orderType === 'Delivery' && order.deliveryAddress && (
            <div className="mb-1">
              <span className="text-gray-500">Deliver to:</span>
              <div className="mt-0.5 text-gray-700">{order.deliveryAddress}</div>
              {order.customerPhone && order.customerPhone !== 'N/A' && (
                <div className="mt-0.5 text-gray-500">Phone: {order.customerPhone}</div>
              )}
            </div>
          )}

          <div className="my-2 border-t border-dashed border-gray-300" />

          <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span className="w-5 text-center">#</span>
            <span className="flex-1 pl-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-14 text-right">Price</span>
          </div>

          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between py-0.5">
                <span className="w-5 text-center text-gray-400">{idx + 1}</span>
                <span className="flex-1 pl-1">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-14 text-right font-bold">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
              {item.notes && (
                <div className="ml-5 text-gray-500">+ {item.notes}</div>
              )}
            </div>
          ))}

          <div className="my-2 border-t border-dashed border-gray-300" />
          <div className="flex justify-between py-0.5 text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(originalSubtotal)}</span>
          </div>
          {productDiscount > 0 && (
            <div className="flex justify-between py-0.5 text-gray-500">
              <span>Product Discount</span>
              <span>-{formatCurrency(productDiscount)}</span>
            </div>
          )}
          {memberDiscount > 0 && (
            <div className="flex justify-between py-0.5 text-gray-500">
              <span>Member Discount</span>
              <span>-{formatCurrency(memberDiscount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between py-0.5 text-gray-500">
              <span>Delivery Fee</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between py-0.5 text-gray-500">
            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="my-1 border-t border-double border-gray-400" />
          <div className="flex justify-between py-0.5 text-base font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <div className="my-2 border-t border-dashed border-gray-300" />
          <div className="mb-1 flex justify-between">
            <span className="text-gray-500">Payment:</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="my-2 border-t border-dashed border-gray-300" />
          <div className="text-center text-sm font-bold tracking-wide">
            Thank you for choosing CHARBEAST!
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
