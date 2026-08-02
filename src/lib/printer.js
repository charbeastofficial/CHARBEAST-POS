import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import logoUrl from '../assets/logo.png';
import { formatCurrency } from './currency';

const IP_STORAGE_KEY = 'charbeast-pos-printer-ip';
const PRINTER_PORT = 9100;

let printerIp = null;

try {
  printerIp = localStorage.getItem(IP_STORAGE_KEY);
} catch {
}

const connectionListeners = new Set();

function notifyConnectionListeners(connected) {
  connectionListeners.forEach((callback) => callback(connected));
}

export function onConnectionChange(callback) {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

export function isPrinterConnected() {
  return !!printerIp;
}

export function getPrinterIp() {
  return printerIp;
}

export async function connectPrinterLAN(ip) {
  if (!ip || !ip.trim()) return;

  printerIp = ip.trim();
  try {
    localStorage.setItem(IP_STORAGE_KEY, printerIp);
  } catch {
  }
  notifyConnectionListeners(true);
}

export function disconnectPrinter() {
  printerIp = null;
  try {
    localStorage.removeItem(IP_STORAGE_KEY);
  } catch {
  }
  notifyConnectionListeners(false);
}

function requireElectronAPI() {
  if (!window.electronAPI) {
    throw new Error('Thermal printing is only available in the CharBeast POS desktop app.');
  }
  return window.electronAPI;
}

export async function checkPrinterReachable(ip, port = PRINTER_PORT) {
  return requireElectronAPI().checkPrinter(ip, port);
}

export async function tryReconnectPrinter() {
  return !!printerIp;
}

async function sendToPrinter(bytes) {
  if (!printerIp) throw new Error('Printer not connected');
  const result = await requireElectronAPI().printBytes(printerIp, PRINTER_PORT, bytes);
  if (!result?.ok) throw new Error(result?.error || 'Failed to print.');
}

function buildEncoder() {
  return new ReceiptPrinterEncoder({ language: 'esc-pos', codepageMapping: 'epson', imageMode: 'raster', feedBeforeCut: 5 });
}

const COLUMNS = [
  { width: 4, align: 'center' },
  { width: 22, align: 'center' },
  { width: 6, align: 'center' },
  { width: 16, align: 'center' },
];
const TOTALS_COLUMNS = [
  { width: 30, align: 'center' },
  { width: 18, align: 'center' },
];
const KITCHEN_COLUMNS = [
  { width: 3, align: 'center' },
  { width: 21, align: 'left' },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function printKitchenTicketDirect(order) {
  if (!isPrinterConnected()) throw new Error('Printer not connected');

  const encoder = buildEncoder();

  encoder
    .align('center')
    .size(2, 2)
    .bold(true)
    .line('KITCHEN TICKET')
    .bold(false)
    .size(1, 1)
    .newline()
    .line(`Order: #${order.id.slice(-6).toUpperCase()}`)
    .line(new Date(order.createdAt).toLocaleString());

  if (order.orderType === 'Dine-in' && order.tableNumber) {
    encoder.newline().size(2, 2).bold(true).line(`TABLE ${order.tableNumber}`).bold(false).size(1, 1);
  }

  encoder.newline();

  if (order.customerName && order.customerName !== 'Walk-In Customer') {
    encoder.line(`Customer: ${order.customerName}`);
  }

  encoder.line(`Type: ${order.orderType}`);

  if (order.orderType === 'Delivery' && order.deliveryAddress) {
    encoder.line(`Deliver to: ${order.deliveryAddress}`);
  }

  encoder
    .newline()
    .rule({ style: 'double' })
    .newline();

  order.items.forEach((item, idx) => {
    encoder
      .size(2, 1)
      .bold(true)
      .table(KITCHEN_COLUMNS, [[`${idx + 1}`, `${item.quantity}x ${item.name}`]])
      .bold(false)
      .size(1, 1);
    if (item.notes) {
      encoder.line(`   + ${item.notes}`);
    }
  });

  encoder.newline().rule({ style: 'double' }).align('center').newline().line('SEND TO KITCHEN').newline(2).cut();

  await sendToPrinter(encoder.encode());
}

export async function printBillReceiptDirect(order, taxRate) {
  if (!isPrinterConnected()) throw new Error('Printer not connected');

  const encoder = buildEncoder();
  const originalSubtotal = order.items.reduce((sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity, 0);
  const chargedSubtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const productDiscount = Math.max(0, originalSubtotal - chargedSubtotal);
  const memberDiscount = order.discountAmount || 0;
  const totalDiscount = productDiscount + memberDiscount;
  const deliveryFee = order.deliveryFee || 0;
  const tax = Number(((chargedSubtotal - memberDiscount) * taxRate).toFixed(2));

  const isRiderOrder = order.source === 'Online' || order.orderType === 'Delivery';

  try {
    const logo = await loadImage(logoUrl);
    encoder.align('center').image(logo, 160, 160, 'atkinson');
  } catch {
  }

  encoder
    .newline()
    .align('center')
    .size(2, 2)
    .bold(true)
    .line('CHARBEAST')
    .bold(false)
    .size(1, 1)
    .bold(true)
    .line('CUSTOMER RECEIPT')
    .bold(false)
    .newline()
    .line('Main PWD Road, Islamabad')
    .line('0333-0335336')
    .rule()
    .align('center')
    .line(`Order: #${order.id.slice(-6).toUpperCase()}`)
    .line(`Date: ${new Date(order.createdAt).toLocaleString()}`);

  if (order.customerName && order.customerName !== 'Walk-In Customer') {
    encoder.line(`Customer: ${order.customerName}`);
  }

  if (isRiderOrder && order.customerPhone) {
    encoder.line(`Phone: ${order.customerPhone}`);
  }

  if (order.orderType === 'Dine-in' && order.tableNumber) {
    encoder.line(`Table: ${order.tableNumber}`);
  }

  encoder.line(`Type: ${order.orderType}`);

  if (order.orderType === 'Delivery' && order.deliveryAddress) {
    encoder.line(`Deliver to: ${order.deliveryAddress}`);
  }

  encoder
    .rule({ style: 'double' })
    .bold(true)
    .table(COLUMNS, [['#', 'Item', 'Qty', 'Price']])
    .bold(false)
    .rule({ style: 'single' });

  order.items.forEach((item, idx) => {
    encoder.table(COLUMNS, [[`${idx + 1}`, item.name, `${item.quantity}`, formatCurrency(item.unitPrice * item.quantity)]]);
    if (item.notes) {
      encoder.align('left').line(`    ${item.notes}`).align('center');
    }
  });

  const totalsRows = [['Subtotal', formatCurrency(originalSubtotal)]];
  if (productDiscount > 0) totalsRows.push(['Product Discount', `-${formatCurrency(productDiscount)}`]);
  if (memberDiscount > 0) totalsRows.push(['Member Discount', `-${formatCurrency(memberDiscount)}`]);
  if (deliveryFee > 0) totalsRows.push(['Delivery Fee', formatCurrency(deliveryFee)]);
  totalsRows.push([`Tax (${(taxRate * 100).toFixed(1)}%)`, formatCurrency(tax)]);

  encoder
    .rule({ style: 'single' })
    .table(TOTALS_COLUMNS, totalsRows)
    .rule({ style: 'double' })
    .size(2, 2)
    .bold(true)
    .table(TOTALS_COLUMNS, [['TOTAL', formatCurrency(order.totalAmount)]])
    .bold(false)
    .size(1, 1);

  if (totalDiscount > 0) {
    encoder.bold(true).table(TOTALS_COLUMNS, [['You Saved', formatCurrency(totalDiscount)]]).bold(false);
  }

  encoder
    .line(`Payment: ${order.paymentMethod}`)
    .rule({ style: 'single' })
    .align('center')   
    .line('Thank you for choosing CHARBEAST!')
    .cut();

  await sendToPrinter(encoder.encode());
}
