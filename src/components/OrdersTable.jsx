import { formatCurrency } from "../lib/currency";
import StatusPill from "./StatusPill";

const TH = "px-3 py-2.5 text-[10px] font-bold tracking-wide text-text-muted whitespace-nowrap uppercase";
const TD = "px-3 py-2.5 text-xs align-middle";

export default function OrdersTable({
  orders,
  filteredOrders,
  tableFilter,
  setTableFilter,
  dineInTables,
  onPrintTicket,
  onPrintBill,
  onPreviewBill,
  onMarkPaid,
  orderSearch,
  setOrderSearch,
}) {
  return (
    <div key="orders" className="flex min-h-0 flex-1 flex-col overflow-hidden animate-[fadeIn_0.25s_ease-out]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream/10 bg-surface-elevated px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-orange text-lg">receipt_long</span>
          <h2 className="text-sm font-bold text-cream">Orders</h2>
          <span className="rounded-md bg-surface-card-highest px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
            {filteredOrders.length}{tableFilter !== "all" ? ` / ${orders.length}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-text-muted">search</span>
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-36 rounded-md border border-cream/10 bg-surface-input py-1.5 pl-7 pr-2 text-[11px] text-cream placeholder:text-text-muted focus:border-brand-orange focus:outline-none sm:w-44"
            />
          </div>
          {dineInTables.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-muted text-[14px]">table_restaurant</span>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="rounded-md border border-cream/10 bg-surface-input px-2 py-1.5 text-[11px] text-cream focus:border-brand-orange focus:outline-none"
              >
                <option value="all">All Tables</option>
                {dineInTables.map((t) => (
                  <option key={t} value={t}>Table {t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Mobile card view */}
        <div className="flex flex-col gap-3 lg:hidden">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-cream/10 bg-surface-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-cream">#{order.id.slice(-6).toUpperCase()}</span>
                <StatusPill status={order.status} />
              </div>
              <div className="mb-2 space-y-1 text-xs text-text-muted">
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="text-cream">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span>{order.orderType}{order.orderType === "Dine-in" && order.tableNumber ? ` · Table ${order.tableNumber}` : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold text-brand-yellow">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span className={order.isPaid ? "text-brand-teal" : "text-brand-red"}>{order.isPaid ? "Paid" : "Unpaid"}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-cream/10 pt-2">
                <button onClick={() => onPrintTicket(order)} title="Print kitchen ticket" className="rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-xs font-bold text-text-muted transition hover:text-cream">KOT</button>
                <button onClick={() => onPreviewBill(order)} className="rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-xs font-bold text-text-muted transition hover:text-cream">Preview</button>
                <button onClick={() => onPrintBill(order)} className="rounded-lg border border-cream/10 bg-surface-input px-3 py-2 text-xs font-bold text-text-muted transition hover:text-cream">Customer Bill</button>
                {!order.isPaid && (
                  <button onClick={() => onMarkPaid(order, order.paymentMethod || 'Cash')} className="rounded-lg bg-brand-orange px-3 py-2 text-xs font-bold text-white transition hover:brightness-105">Mark Paid</button>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-xs text-text-muted">
              {tableFilter !== "all" ? `No orders for Table ${tableFilter}.` : "No orders yet."}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-cream/10 bg-surface-card lg:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/10 bg-surface-card-highest/50">
                  <th className={TH}>Order</th>
                  <th className={TH}>Time</th>
                  <th className={TH}>Source</th>
                  <th className={TH}>Customer</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Table</th>
                  <th className={`${TH} text-right`}>Total</th>
                  <th className={TH}>Paid</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-cream/5">
                    <td className={`${TD} font-bold text-cream`}>#{order.id.slice(-6).toUpperCase()}</td>
                    <td className={`${TD} text-text-muted`}>
                      {new Date(order.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className={TD}>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          order.source === "Online" ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-orange/15 text-brand-orange"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[10px]">{order.source === "Online" ? "language" : "storefront"}</span>
                        {order.source === "Online" ? "Online" : "Local"}
                      </span>
                    </td>
                    <td className={`${TD} text-cream`}>{order.customerName}</td>
                    <td className={`${TD} text-text-muted`}>{order.orderType}</td>
                    <td className={`${TD} text-text-muted`}>{order.orderType === "Dine-in" && order.tableNumber ? order.tableNumber : "—"}</td>
                    <td className={`${TD} text-right font-bold text-brand-yellow`}>{formatCurrency(order.totalAmount)}</td>
                    <td className={TD}>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          order.isPaid ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-red/15 text-brand-red"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className={TD}>
                      <StatusPill status={order.status} />
                    </td>
                    <td className={`${TD} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPrintTicket(order)}
                          title="Print kitchen ticket"
                          className="rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-xs font-bold text-text-muted transition hover:text-cream"
                        >
                          KOT
                        </button>
                        <button
                          onClick={() => onPreviewBill(order)}
                          title="Preview bill"
                          className="rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-xs font-bold text-text-muted transition hover:text-cream"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => onPrintBill(order)}
                          title="Print bill"
                          className="rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1.5 text-xs font-bold text-text-muted transition hover:text-cream"
                        >
                          Customer Bill
                        </button>
                        {!order.isPaid && (
                          <button
                            onClick={() => onMarkPaid(order, order.paymentMethod || 'Cash')}
                            className="rounded-lg bg-brand-orange px-2.5 py-1.5 text-xs font-bold text-white transition hover:brightness-105"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs text-text-muted">
                      {tableFilter !== "all" ? `No orders for Table ${tableFilter}.` : "No orders yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}