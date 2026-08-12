import React, { useState, useEffect, useCallback } from "react";
import { db, resolveTaxRate } from "./db";
import { useAuth } from "./hooks/useAuth";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import OfflineScreen from "./components/OfflineScreen";
import LoginPage from "./components/LoginPage";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import CategoryBar from "./components/CategoryBar";
import QueueView from "./components/QueueView";
import ProductGrid from "./components/ProductGrid";
import TicketPanel from "./components/TicketPanel";
import QueuedOrderDetail from "./components/QueuedOrderDetail";
import CheckoutModal from "./components/CheckoutModal";
import ModifierModal from "./components/ModifierModal";
import OrdersTable from "./components/OrdersTable";
import SettingsView from "./components/SettingsView";
import HelpView from "./components/HelpView";
import PrinterConnectModal from "./components/PrinterConnectModal";
import ReceiptPreviewModal from "./components/ReceiptPreviewModal";
import { ToastProvider, useToast } from "./components/Toast";
import {
  isPrinterConnected,
  connectPrinterLAN,
  disconnectPrinter,
  tryReconnectPrinter,
  onConnectionChange,
  printKitchenTicketDirect,
  printBillReceiptDirect,
} from "./lib/printer";

export default function App() {
  return <ToastProvider><AppInner /></ToastProvider>;
}

// Builds categoryId -> position in the admin's arrangement (top-level
// categories in sortOrder, each one's subcategories right after it in their
// own sortOrder) so products can be grouped/ordered to match Menu tab order.
function buildCategoryOrderIndex(categories) {
  const topLevel = categories.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const index = new Map();
  let i = 0;
  for (const top of topLevel) {
    index.set(top.id, i++);
    const children = categories.filter(c => c.parentId === top.id).sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of children) {
      index.set(child.id, i++);
    }
  }
  return index;
}

function AppInner() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const toast = useToast();
  const isOnline = useOnlineStatus();

  // Clock state
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Data state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isMemberOrder, setIsMemberOrder] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ taxRate: 0.05, taxByPaymentEnabled: false, cashTaxRate: 0.16, cardTaxRate: 0.05, memberDiscountPercent: 10 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [view, setView] = useState("register"); // 'register' | 'queue' | 'orders'
  const [tableFilter, setTableFilter] = useState("all"); // Orders section: filter dine-in orders by table number
  const [orderSearch, setOrderSearch] = useState("");
  const [printerConnected, setPrinterConnected] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null); // { order, type: 'ticket'|'bill' }

  // Register (Current Walk-in order) state
  const [ticketItems, setTicketItems] = useState([]);
  const [selectedQueuedOrder, setSelectedQueuedOrder] = useState(null);
  const [pendingBillOrder, setPendingBillOrder] = useState(null); // { order, mode: 'print' | 'preview' } -- awaiting first-time payment method choice
  const [ticketOrderType, setTicketOrderType] = useState("Dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem("charbeast-pos-font-size"), 10) || 16;
    } catch {
      return 16;
    }
  });
  const [ticketSelectedArea, setTicketSelectedArea] = useState(null);
  // null means "use the auto-calculated value" -- set once the cashier types
  // a manual override at checkout, before the order is even created.
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState(null);
  // A cashier-added extra discount, separate from (and stacked on top of)
  // the member discount -- not a replacement for it. Member discount only
  // ever applies when Member is selected.
  const [extraDiscount, setExtraDiscount] = useState('0');
  const [ticketExtraCharges, setTicketExtraCharges] = useState('0');
  const [ticketExtraChargesNote, setTicketExtraChargesNote] = useState('');
  // Set while editing an existing (unpaid) order's items/fields through the
  // same ticket-builder + checkout screen used to create one.
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [deliverySettingsFull, setDeliverySettingsFull] = useState({
    shopLat: null, shopLng: null, deliveryRadiusKm: 5,
    deliveryFreeMinAmount: 0, deliveryFreeMaxDistance: 0,
    deliveryBaseFee: 0, deliveryPerKmRate: 0, deliveryMaxDistance: 0,
    deliveryChargeType: 'per_km',
  });

  // New order visual alert state (contains order IDs that are flashing)
  const [flashingOrders, setFlashingOrders] = useState([]);

  // Falls back to the emoji icon if an image URL is set but fails to load
  // (broken link, network hiccup) instead of showing a broken-image glyph.
  const [brokenImageIds, setBrokenImageIds] = useState(() => new Set());
  const markImageBroken = (id) => setBrokenImageIds(prev => new Set(prev).add(id));

  // Customize Modal state
  const [customizeProduct, setCustomizeProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Which ticket item currently has its note field expanded (only one at a time)
  const [expandedNoteId, setExpandedNoteId] = useState(null);

  // Checkout popup: order type, payment method, cash calculator, and confirm actions
  // only appear here, kept out of the main order panel to keep it to just the cart.
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const playBuzzer = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const pulse = (freq, start, duration, gainValue, type) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(gainValue, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Three loud buzzer pulses: sawtooth + square layered for harshness
      pulse(220, 0, 0.15, 0.35, "sawtooth");
      pulse(330, 0, 0.15, 0.2, "square");
      pulse(220, 0.3, 0.15, 0.35, "sawtooth");
      pulse(330, 0.3, 0.15, 0.2, "square");
      pulse(220, 0.6, 0.2, 0.35, "sawtooth");
      pulse(330, 0.6, 0.2, 0.2, "square");
    } catch (err) {
      console.warn("Audio Context failed to play buzzer:", err);
    }
  };

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore a previously-entered printer IP, and keep the sidebar indicator
  // in sync with connect/disconnect events.
  useEffect(() => {
    tryReconnectPrinter().then((connected) => setPrinterConnected(connected));
    return onConnectionChange(setPrinterConnected);
  }, []);

  const printTicket = async (order) => {
    if (!isPrinterConnected()) {
      toast("Printer not connected", "error");
      return;
    }
    try {
      await printKitchenTicketDirect(order);
      toast("Kitchen ticket sent to printer");
    } catch (err) {
      console.error("Failed to print kitchen ticket:", err);
      toast(`Failed to print kitchen ticket: ${err.message || "unknown error"}`, "error");
    }
  };

  const doPrintBill = async (order) => {
    if (!isPrinterConnected()) {
      toast("Printer not connected", "error");
      return;
    }
    try {
      await printBillReceiptDirect(order, resolveTaxRate(siteSettings, order.paymentMethod));
      toast("Bill sent to printer");
    } catch (err) {
      console.error("Failed to print bill:", err);
      toast(`Failed to print bill: ${err.message || "unknown error"}`, "error");
    }
  };

  // The first time a bill is shown for an order, its payment method (and
  // therefore its tax) isn't decided yet -- ask, lock it in, then proceed.
  // Once decided, later previews/reprints just use what's already stored.
  const printBill = (order) => {
    if (!order.paymentMethod) {
      setPendingBillOrder({ order, mode: "print" });
      return;
    }
    doPrintBill(order);
  };

  const previewBill = (order) => {
    if (!order.paymentMethod) {
      setPendingBillOrder({ order, mode: "preview" });
      return;
    }
    setReceiptPreview(order);
  };

  const handlePickBillPaymentMethod = async (paymentMethod) => {
    if (!pendingBillOrder) return;
    const { order, mode } = pendingBillOrder;
    setPendingBillOrder(null);
    try {
      const updated = await db.setOrderPaymentMethod(order.id, paymentMethod);
      setOrders((prev) => sortOrders(prev.map((o) => (o.id === updated.id ? updated : o))));
      if (mode === "preview") setReceiptPreview(updated);
      else await doPrintBill(updated);
    } catch (err) {
      console.error("Failed to set order payment method:", err);
      toast(err.message || "Error setting payment method.", "error");
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [cats, prods, dls, ords, settings, areas] = await Promise.all([
          db.getCategories(),
          db.getProducts(),
          db.getDeals(),
          db.getOrders(),
          db.getSiteSettings(),
          db.getDeliveryAreas(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setDeals(dls);
        setSiteSettings(settings);
        setDeliveryAreas(areas);
        setDeliverySettingsFull({
          shopLat: settings.shopLat, shopLng: settings.shopLng, deliveryRadiusKm: settings.deliveryRadiusKm,
          deliveryFreeMinAmount: settings.deliveryFreeMinAmount || 0,
          deliveryFreeMaxDistance: settings.deliveryFreeMaxDistance || 0,
          deliveryBaseFee: settings.deliveryBaseFee || 0,
          deliveryPerKmRate: settings.deliveryPerKmRate || 0,
          deliveryMaxDistance: settings.deliveryMaxDistance || 0,
          deliveryChargeType: settings.deliveryChargeType || 'per_km',
        });

        // Sort orders so Pending are first, then sorted by date desc
        setOrders(sortOrders(ords));
      } catch (err) {
        console.error("Failed to load POS data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db.subscribeToRealtime({
      order_created: (newOrder) => {
        // Add to order list
        setOrders(prev => sortOrders([newOrder, ...prev]));
        // Only flash/chime for incoming website orders -- not the cashier's own POS sales
        if (newOrder.source === "Online") {
          setFlashingOrders(prev => [...prev, newOrder.id]);
          playBuzzer();
        }
      },
      order_updated: (updatedOrder) => {
        setOrders(prev => sortOrders(prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)));

        // Synchronize selected queued order state if it's currently viewed
        setSelectedQueuedOrder(prev => {
          if (prev && prev.id === updatedOrder.id) {
            return updatedOrder;
          }
          return prev;
        });
      },
      product_updated: (updatedProd) => {
        setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
      },
      product_created: (newProd) => {
        setProducts(prev => [...prev, newProd]);
      },
      product_deleted: (deletedProd) => {
        setProducts(prev => prev.filter(p => p.id !== deletedProd.id));
      },
      deals_updated: (dls) => {
        setDeals(dls);
      },
      site_settings_updated: (settings) => {
        setSiteSettings(settings);
      }
    });

    return () => unsubscribe();
  }, [soundEnabled, user]);

  // Display size, from the Settings tab -- Tailwind's spacing/type scale is
  // rem-based, so scaling the root font size scales text, buttons and
  // spacing together, not just literal text.
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    try {
      localStorage.setItem("charbeast-pos-font-size", String(fontSize));
    } catch {
    }
  }, [fontSize]);

  // Order sorting: Pending (queue) -> Active -> Completed -> Cancelled.
  // Grouped by isPaid first (same rule the status pill itself uses) so a
  // paid order always sorts with Completed even if status wasn't updated.
  const sortOrders = (orderList) => {
    const priorityOf = (o) => {
      if (o.status === "Cancelled") return 3;
      if (o.isPaid) return 2;
      if (o.status === "Pending") return 0;
      return 1;
    };
    return [...orderList].sort((a, b) => {
      const priorityDiff = priorityOf(a) - priorityOf(b);
      if (priorityDiff !== 0) return priorityDiff;
      // If same status, sort by created date descending
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  // Cashier cart operations. `discountOverride` (a percentage) is used by
  // deals, which carry their own discount just like products do.
  const addToTicket = (product, modifiers = [], size = null, addons = [], discountOverride = null) => {
    const sizeId = size ? `-${size.id}` : "";
    const modId = modifiers.map(m => m.name).sort().join("|");
    const addonId = addons.map(a => a.id).sort().join("|");
    const ticketItemId = `${product.id}${sizeId}-${modId}-${addonId}`;

    const cat = categories.find((c) => c.id === product.categoryID);
    const discount = discountOverride !== null
      ? discountOverride
      : (product.discountPercent > 0 ? product.discountPercent : (cat?.discountPercent || 0));

    setTicketItems(prev => {
      const existing = prev.find(item => item.ticketItemId === ticketItemId);
      if (existing) {
        return prev.map(item =>
          item.ticketItemId === ticketItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const basePrice = size ? size.price : product.basePrice;
        const modTotal = modifiers.reduce((acc, m) => acc + m.price, 0);
        const addonTotal = addons.reduce((acc, a) => acc + a.price, 0);
        const discountedBase = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
        const itemPrice = discountedBase + modTotal + addonTotal;
        return [...prev, {
          ticketItemId,
          product,
          size,
          modifiers,
          addons,
          quantity: 1,
          itemPrice,
          originalPrice: basePrice + modTotal + addonTotal,
          discountPercent: discount,
          note: ""
        }];
      }
    });

    setCustomizeProduct(null);
    setSelectedSize(null);
    setSelectedModifiers([]);
    setSelectedAddons([]);
  };

  const updateTicketQty = (ticketItemId, change) => {
    setTicketItems(prev => prev.map(item => {
      if (item.ticketItemId === ticketItemId) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const updateTicketItemNote = (ticketItemId, note) => {
    setTicketItems(prev => prev.map(item =>
      item.ticketItemId === ticketItemId ? { ...item, note } : item
    ));
  };

  // No tax at this stage -- the payment method (and therefore the rate)
  // isn't decided yet. It's applied once the customer bill is first printed
  // (see handlePickBillPaymentMethod / db.setOrderPaymentMethod).
  const memberDiscountPercent = siteSettings?.memberDiscountPercent ?? 10;
  const ticketSubtotal = ticketItems.reduce((acc, item) => acc + (item.itemPrice * item.quantity), 0);
  // Member discount only ever applies when Member is selected; the extra
  // discount the cashier types in is a separate, additional amount on top
  // of that (or the only discount at all, for a non-member order).
  const memberDiscountAmount = isMemberOrder ? ticketSubtotal * (memberDiscountPercent / 100) : 0;
  const extraDiscountAmount = parseFloat(extraDiscount) || 0;
  const ticketDiscountAmount = memberDiscountAmount + extraDiscountAmount;

  const autoDeliveryFee = (() => {
    if (ticketOrderType !== "Delivery") return 0;
    if (deliverySettingsFull.deliveryFreeMinAmount > 0 && ticketSubtotal >= deliverySettingsFull.deliveryFreeMinAmount) return 0;
    if (deliverySettingsFull.deliveryChargeType === 'area') {
      return ticketSelectedArea ? ticketSelectedArea.charge : 0;
    }
    return Number(deliverySettingsFull.deliveryBaseFee) || 0;
  })();
  const ticketDeliveryFee = deliveryFeeOverride !== null ? (parseFloat(deliveryFeeOverride) || 0) : autoDeliveryFee;
  const ticketExtraChargesAmount = parseFloat(ticketExtraCharges) || 0;

  const ticketTotal = ticketSubtotal - ticketDiscountAmount + ticketDeliveryFee + ticketExtraChargesAmount;

  const buildTicketOrderPayload = () => ({
    customerName: customerName.trim() || "Walk-In Customer",
    customerPhone: customerPhone.trim() || "N/A",
    discountAmount: parseFloat(ticketDiscountAmount.toFixed(2)),
    memberDiscountAmount: parseFloat(memberDiscountAmount.toFixed(2)),
    orderType: ticketOrderType,
    deliveryAddress: ticketOrderType === "Delivery" ? deliveryAddress.trim() : "",
    tableNumber: ticketOrderType === "Dine-in" ? tableNumber.trim() : "",
    deliveryFee: parseFloat(ticketDeliveryFee.toFixed(2)),
    extraCharges: parseFloat(ticketExtraChargesAmount.toFixed(2)),
    extraChargesNote: ticketExtraChargesNote.trim(),
    totalAmount: parseFloat(ticketTotal.toFixed(2)),
    items: ticketItems.map(item => ({
      productID: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.itemPrice,
      originalPrice: item.originalPrice,
      notes: [item.size && item.size.name, ...item.modifiers.map(m => m.name), ...item.addons.map(a => a.name), item.note?.trim()].filter(Boolean).join(" — ")
    }))
  });

  const clearTicket = () => {
    setTicketItems([]);
    setDeliveryAddress("");
    setCustomerName("");
    setCustomerPhone("");
    setTableNumber("");
    setExpandedNoteId(null);
    setTicketSelectedArea(null);
    setIsMemberOrder(false);
    setDeliveryFeeOverride(null);
    setExtraDiscount('0');
    setTicketExtraCharges('0');
    setTicketExtraChargesNote('');
    setEditingOrderId(null);
  };

  const validateTicketForCheckout = () => {
    if (ticketItems.length === 0) return false;
    if (ticketOrderType === "Delivery" && !deliveryAddress.trim()) {
      toast("Please enter a delivery address.", "error");
      return false;
    }
    if (ticketOrderType === "Delivery" && deliverySettingsFull.deliveryChargeType === 'area' && !ticketSelectedArea) {
      toast("Please select a delivery area.", "error");
      return false;
    }
    return true;
  };

  // The waiter's order goes straight to the kitchen -- no payment method
  // decided yet (so no tax applied yet either). Both are decided later, when
  // the customer bill is first printed from the Orders section.
  const handleSendToKitchen = async () => {
    if (!validateTicketForCheckout()) return;

    try {
      const createdOrder = await db.createOrder({
        ...buildTicketOrderPayload(),
        status: "Preparing",
        isPaid: false,
      });

      clearTicket();
      setShowCheckoutModal(false);
      toast("Order sent to kitchen!");
      printTicket(createdOrder);
    } catch (err) {
      console.error("Error sending ticket to kitchen:", err);
      toast(err.message || "Error saving ticket. Check backend connection.", "error");
    }
  };

  // Reopens an existing (unpaid) order in the same ticket-builder + checkout
  // screen used to create one -- items reconstructed from what was saved are
  // shown as plain editable/removable lines (their original modifier picks
  // aren't stored in a re-editable form); new items can still be added
  // normally from the product grid behind the checkout screen.
  const handleEditOrder = (order) => {
    setTicketItems(order.items.map((item, i) => ({
      ticketItemId: `edit-${order.id}-${i}-${Date.now()}`,
      product: { id: item.productId, name: item.name },
      size: null,
      modifiers: [],
      addons: [],
      quantity: item.quantity,
      itemPrice: item.unitPrice,
      originalPrice: item.originalUnitPrice ?? item.unitPrice,
      discountPercent: 0,
      note: item.notes || "",
    })));
    setTicketOrderType(order.orderType || "Dine-in");
    setDeliveryAddress(order.orderType === "Delivery" ? order.deliveryAddress || "" : "");
    setCustomerName(order.customerName === "Walk-In Customer" ? "" : order.customerName || "");
    setCustomerPhone(order.customerPhone === "N/A" ? "" : order.customerPhone || "");
    setTableNumber(order.tableNumber || "");
    setTicketSelectedArea(null);
    setIsMemberOrder((order.memberDiscountAmount || 0) > 0);
    setDeliveryFeeOverride(String(order.deliveryFee || 0));
    setExtraDiscount(String((order.discountAmount || 0) - (order.memberDiscountAmount || 0)));
    setTicketExtraCharges(String(order.extraCharges || 0));
    setTicketExtraChargesNote(order.extraChargesNote || "");
    setEditingOrderId(order.id);
    setSelectedQueuedOrder(null);
    setView("register");
    setShowCheckoutModal(true);
  };

  const handleSaveEditedOrder = async () => {
    if (!validateTicketForCheckout()) return;

    try {
      const updated = await db.updateOrderItems(editingOrderId, buildTicketOrderPayload());
      setOrders((prev) => sortOrders(prev.map((o) => (o.id === updated.id ? updated : o))));
      setSelectedQueuedOrder((prev) => (prev && prev.id === updated.id ? updated : prev));
      clearTicket();
      setShowCheckoutModal(false);
      toast("Order updated!");
    } catch (err) {
      console.error("Error saving edited order:", err);
      toast(err.message || "Error saving changes.", "error");
    }
  };

  // Settle payment on an existing order. The bill is printed separately
  // (before payment, so the customer can see what they owe).
  const handleMarkOrderPaid = async (order, paymentMethod) => {
    try {
      await db.markOrderPaid(order.id, paymentMethod);
      toast("Order marked as paid");
    } catch (err) {
      console.error("Error marking order paid:", err);
      toast(err.message || "Error updating payment status.", "error");
    }
  };

  // Online orders are cash-on-delivery: confirming an order sends it straight
  // to the kitchen (no payment step yet -- cash is collected on delivery).
  const handleConfirmOnlineOrder = async () => {
    if (!selectedQueuedOrder) return;
    try {
      await db.updateOrderStatus(selectedQueuedOrder.id, "Preparing");
      toast("Online order confirmed");
      printTicket(selectedQueuedOrder);
    } catch (err) {
      console.error("Failed to confirm order:", err);
      toast(err.message || "Error confirming order.", "error");
    }
  };

  // Select an order from the queue
  const handleSelectQueuedOrder = useCallback((order) => {
    setSelectedQueuedOrder(order);
    setView("register");
    // Remove from flashing alerts
    setFlashingOrders(prev => prev.filter(id => id !== order.id));
  }, []);

  // Change status of selected queued order
  const handleUpdateStatus = async (status, cancelReason) => {
    if (!selectedQueuedOrder) return;
    try {
      await db.updateOrderStatus(selectedQueuedOrder.id, status, cancelReason);
      toast(`Order status updated to ${status}${status === "Cancelled" ? ": " + cancelReason : ""}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast("Error updating order status.", "error");
    }
  };

  // Menu filtering
  const activeCategoryChildIds = categories
    .filter(c => c.parentId === activeCategory)
    .map(c => c.id);
  const categoryOrderIndex = buildCategoryOrderIndex(categories);
  const filteredProducts = products
    .filter(p => {
      const matchesCategory =
        activeCategory === "all" ||
        p.categoryID === activeCategory ||
        activeCategoryChildIds.includes(p.categoryID);
      return matchesCategory;
    })
    .sort((a, b) => {
      const ia = categoryOrderIndex.get(a.categoryID) ?? Infinity;
      const ib = categoryOrderIndex.get(b.categoryID) ?? Infinity;
      if (ia !== ib) return ia - ib;
      return a.name.localeCompare(b.name);
    });

  // Order queue: only unconfirmed website orders, oldest first (first come, first served).
  // Once a cashier confirms one (moving it off Pending), it naturally drops out of this list.
  const queueOrders = orders
    .filter(o => o.source === "Online" && o.status === "Pending")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Orders section: filter dine-in orders down to a single table.
  const dineInTables = [...new Set(
    orders.filter(o => o.orderType === "Dine-in" && o.tableNumber).map(o => o.tableNumber)
  )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const tableFilteredOrders = tableFilter === "all" ? orders : orders.filter(o => o.tableNumber === tableFilter);
  const searchedOrders = orderSearch
    ? tableFilteredOrders.filter(o =>
        o.id.slice(-6).toUpperCase().includes(orderSearch.toUpperCase()) ||
        (o.customerName && o.customerName.toUpperCase().includes(orderSearch.toUpperCase())) ||
        o.orderType.toUpperCase().includes(orderSearch.toUpperCase()) ||
        (o.tableNumber && o.tableNumber.toString().includes(orderSearch))
      )
    : tableFilteredOrders;

  const handleProductClick = (product) => {
    if (!product.isAvailable) return;
    const hasModifiers = product.modifiers?.length > 0;
    const hasSizes = product.sizes?.length > 0;
    const hasAddons = product.addons?.length > 0;
    if (hasModifiers || hasSizes || hasAddons) {
      setCustomizeProduct(product);
      setSelectedSize(null);
      setSelectedModifiers([]);
      setSelectedAddons([]);
    } else {
      addToTicket(product, []);
    }
  };

  // Add every item in a deal bundle to the ticket at once. The deal's own
  // discount applies to each item, just like a product discount.
  const handleDealAdd = (deal) => {
    deal.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;
      const modifiers = (item.modifierNames || [])
        .map((name) => product.modifiers?.find((m) => m.name === name))
        .filter(Boolean);
      for (let i = 0; i < (item.quantity || 1); i += 1) {
        addToTicket(product, modifiers, null, [], deal.discountPercent || 0);
      }
    });
  };

  const selectSize = (size) => {
    setSelectedSize(size);
  };

  const toggleModifier = (mod) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.name === mod.name);
      if (exists) {
        return prev.filter(m => m.name !== mod.name);
      } else {
        return [...prev, mod];
      }
    });
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const getCustomizingTotal = () => {
    if (!customizeProduct) return 0;
    const basePrice = selectedSize ? selectedSize.price : customizeProduct.basePrice;
    const modsPrice = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
    const addonsPrice = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    return basePrice + modsPrice + addonsPrice;
  };

  if (!isOnline) {
    return <OfflineScreen />;
  }

  if (authLoading) {
    return (
      <div className="shell-glow flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-cream/15 border-t-brand-orange" />
          <p className="mt-5 text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div id="app-root" className="flex h-screen flex-col bg-surface">
      <AppHeader time={time} contactPhone={siteSettings?.contactPhone} contactAddress={siteSettings?.contactAddress} />

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[64px_1fr]">
        <Sidebar
          view={view}
          onChangeView={setView}
          queueCount={queueOrders.length}
          unpaidCount={orders.filter(o => !o.isPaid && o.status !== "Cancelled").length}
          printerConnected={printerConnected}
          onConnectPrinter={() => setShowPrinterModal(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          userLabel={user?.display_name || user?.email}
          onLogout={logout}
          hasUnsavedTicket={ticketItems.length > 0}
        />

        {/* MAIN CONTENT */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          {view === "queue" && (
            <QueueView orders={queueOrders} flashingOrders={flashingOrders} onSelectOrder={handleSelectQueuedOrder} />
          )}

          {view === "register" && (
            <div key="register" className="flex min-h-0 flex-1 flex-col overflow-hidden animate-[fadeIn_0.25s_ease-out]">
              <CategoryBar
                categories={categories}
                deals={deals}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                brokenImageIds={brokenImageIds}
                markImageBroken={markImageBroken}
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_380px]">
                <ProductGrid
                  loading={loading}
                  activeCategory={activeCategory}
                  deals={deals}
                  products={activeCategory === "deals" ? deals : filteredProducts}
                  allProducts={products}
                  categories={categories}
                  brokenImageIds={brokenImageIds}
                  markImageBroken={markImageBroken}
                  onProductClick={handleProductClick}
                  onDealAdd={handleDealAdd}
                />

                <section className="flex min-h-0 flex-col overflow-hidden bg-surface-card-high">
                  {selectedQueuedOrder ? (
                    <QueuedOrderDetail
                      order={selectedQueuedOrder}
                      products={products}
                      categories={categories}
                      brokenImageIds={brokenImageIds}
                      markImageBroken={markImageBroken}
                      onPrintTicket={printTicket}
                      onPrintBill={printBill}
                      onPreviewBill={previewBill}
                      onClose={() => setSelectedQueuedOrder(null)}
                      onConfirm={handleConfirmOnlineOrder}
                      onUpdateStatus={handleUpdateStatus}
                      onMarkPaid={handleMarkOrderPaid}
                      onEditOrder={handleEditOrder}
                    />
                  ) : (
                    <>
                      <TicketPanel
                        ticketItems={ticketItems}
                        categories={categories}
                        brokenImageIds={brokenImageIds}
                        markImageBroken={markImageBroken}
                        expandedNoteId={expandedNoteId}
                        setExpandedNoteId={setExpandedNoteId}
                        updateTicketQty={updateTicketQty}
                        updateTicketItemNote={updateTicketItemNote}
                        clearTicket={clearTicket}
                        ticketTotal={ticketTotal}
                        onCheckout={() => setShowCheckoutModal(true)}
                      />

                      {showCheckoutModal && ticketItems.length > 0 && (
                        <CheckoutModal
                          ticketItems={ticketItems}
                          ticketOrderType={ticketOrderType}
                          setTicketOrderType={setTicketOrderType}
                          deliveryAddress={deliveryAddress}
                          setDeliveryAddress={setDeliveryAddress}
                          customerName={customerName}
                          setCustomerName={setCustomerName}
                          customerPhone={customerPhone}
                          setCustomerPhone={setCustomerPhone}
                          tableNumber={tableNumber}
                          setTableNumber={setTableNumber}
                          ticketSubtotal={ticketSubtotal}
                          ticketDeliveryFee={ticketDeliveryFee}
                          onChangeDeliveryFee={setDeliveryFeeOverride}
                          memberDiscountAmount={memberDiscountAmount}
                          extraDiscount={extraDiscount}
                          onChangeExtraDiscount={setExtraDiscount}
                          ticketExtraCharges={ticketExtraCharges}
                          onChangeExtraCharges={setTicketExtraCharges}
                          ticketExtraChargesNote={ticketExtraChargesNote}
                          onChangeExtraChargesNote={setTicketExtraChargesNote}
                          ticketTotal={ticketTotal}
                          memberDiscountPercent={memberDiscountPercent}
                          isMemberOrder={isMemberOrder}
                          onToggleMember={setIsMemberOrder}
                          deliverySettings={deliverySettingsFull}
                          deliveryAreas={deliveryAreas}
                          selectedArea={ticketSelectedArea}
                          onSelectArea={setTicketSelectedArea}
                          isEditing={!!editingOrderId}
                          onClose={() => setShowCheckoutModal(false)}
                          onSendToKitchen={editingOrderId ? handleSaveEditedOrder : handleSendToKitchen}
                        />
                      )}
                    </>
                  )}
                </section>
              </div>
            </div>
          )}

          {view === "orders" && (
            <OrdersTable
              orders={orders}
              filteredOrders={searchedOrders}
              tableFilter={tableFilter}
              setTableFilter={setTableFilter}
              dineInTables={dineInTables}
              orderSearch={orderSearch}
              setOrderSearch={setOrderSearch}
              onPrintTicket={printTicket}
              onPrintBill={printBill}
              onPreviewBill={previewBill}
              onMarkPaid={handleMarkOrderPaid}
              onEditOrder={handleEditOrder}
            />
          )}

          {view === "settings" && (
            <SettingsView fontSize={fontSize} onChangeFontSize={setFontSize} />
          )}

          {view === "help" && <HelpView />}
        </div>
      </div>

      {customizeProduct && (
        <ModifierModal
          product={customizeProduct}
          selectedSize={selectedSize}
          selectedModifiers={selectedModifiers}
          selectedAddons={selectedAddons}
          onSelectSize={selectSize}
          onToggleModifier={toggleModifier}
          onToggleAddon={toggleAddon}
          onClose={() => { setCustomizeProduct(null); setSelectedSize(null); setSelectedModifiers([]); setSelectedAddons([]); }}
          onAdd={() => addToTicket(customizeProduct, selectedModifiers, selectedSize, selectedAddons)}
          total={getCustomizingTotal()}
        />
      )}

      <div className="flex flex-col gap-2 border-t border-cream/10 bg-surface p-2 lg:hidden">
        <Sidebar
          view={view}
          onChangeView={setView}
          queueCount={queueOrders.length}
          unpaidCount={orders.filter(o => !o.isPaid && o.status !== "Cancelled").length}
          printerConnected={printerConnected}
          onConnectPrinter={() => setShowPrinterModal(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          userLabel={user?.display_name || user?.email}
          onLogout={logout}
          hasUnsavedTicket={ticketItems.length > 0}
        />
      </div>

      {showPrinterModal && (
        <PrinterConnectModal
          connected={printerConnected}
          onConnectLAN={connectPrinterLAN}
          onDisconnect={disconnectPrinter}
          onClose={() => setShowPrinterModal(false)}
        />
      )}

      {receiptPreview && (
        <ReceiptPreviewModal
          order={receiptPreview}
          taxRate={resolveTaxRate(siteSettings, receiptPreview.paymentMethod)}
          onClose={() => setReceiptPreview(null)}
        />
      )}

      {pendingBillOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setPendingBillOrder(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-2xl border border-cream/10 bg-surface-elevated p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1.5 text-lg font-bold text-cream">How is the customer paying?</h2>
            <p className="mb-5 text-sm text-text-muted">
              Sales tax depends on the payment method -- this will be printed on the bill and can still be corrected later when the order is marked paid.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handlePickBillPaymentMethod("Cash")}
                className="flex items-center gap-2.5 rounded-xl border border-cream/10 bg-surface-input px-4 py-3 text-sm font-bold text-cream transition hover:border-brand-orange hover:bg-cream/5"
              >
                <span className="material-symbols-outlined text-brand-orange">payments</span>
                Cash
              </button>
              <button
                type="button"
                onClick={() => handlePickBillPaymentMethod("Card")}
                className="flex items-center gap-2.5 rounded-xl border border-cream/10 bg-surface-input px-4 py-3 text-sm font-bold text-cream transition hover:border-brand-orange hover:bg-cream/5"
              >
                <span className="material-symbols-outlined text-brand-orange">credit_card</span>
                Card / Online
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPendingBillOrder(null)}
              className="mt-4 w-full rounded-lg border border-cream/10 py-2 text-xs font-bold text-text-muted transition hover:text-cream"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}