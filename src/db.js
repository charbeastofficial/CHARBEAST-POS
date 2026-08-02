import { supabase } from './lib/supabase';

function mapModifier(row) {
  return {
    name: row.name,
    price: Number(row.additional_price),
  };
}

function mapAddon(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    imageURL: row.image_url || '',
  };
}

// product_addons rows come in as { sort_order, addons: {...} } from the
// `product_addons(sort_order, addons(*))` embedded select.
function mapProductAddon(row) {
  return mapAddon(row.addons);
}

function mapProductSize(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    sortOrder: row.sort_order,
  };
}

function mapProduct(row, modifiers = [], sizes = [], addons = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    basePrice: Number(row.base_price),
    imageURL: row.image_url,
    categoryID: row.category_id,
    isAvailable: row.is_available,
    modifiers: modifiers.map(mapModifier),
    sizes: sizes.map(mapProductSize),
    addons: addons.map(mapProductAddon),
    discountPercent: Number(row.discount_percent) || 0,
  };
}

function mapOrderItem(row) {
  return {
    name: row.product_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    originalUnitPrice: row.original_unit_price != null ? Number(row.original_unit_price) : null,
    notes: row.notes,
    productId: row.product_id,
  };
}

function mapOrder(row, items = []) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status,
    totalAmount: Number(row.total_amount),
    deliveryFee: Number(row.delivery_fee) || 0,
    orderType: row.order_type,
    paymentMethod: row.payment_method,
    deliveryAddress: row.delivery_address || '',
    deliveryLat: row.delivery_lat ?? null,
    deliveryLng: row.delivery_lng ?? null,
    tableNumber: row.table_number || '',
    cancelReason: row.cancel_reason || '',
    isPaid: row.is_paid,
    source: row.source,
    customerId: row.customer_id || null,
    discountAmount: Number(row.discount_amount) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map(mapOrderItem),
  };
}

function mapDealItem(row) {
  return {
    productId: row.product_id,
    quantity: row.quantity,
    modifierNames: row.modifier_names || [],
  };
}

function mapDeal(row, items = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    badge: row.badge,
    price: Number(row.price),
    imageURL: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    items: items.map(mapDealItem),
  };
}

export function resolveTaxRate(settings, paymentMethod) {
  if (!settings.taxByPaymentEnabled) return settings.taxRate;
  return paymentMethod === 'Cash' ? settings.cashTaxRate : settings.cardTaxRate;
}

// Order totals are computed from scratch here rather than adjusting the
// stored total, since tax is only known once a payment method is decided
// (see createOrder: payment_method starts out NULL).
async function computeTotalForPaymentMethod(id, paymentMethod, settings) {
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('orders').select('discount_amount, delivery_fee').eq('id', id).single(),
    supabase.from('order_items').select('quantity, unit_price').eq('order_id', id),
  ]);
  if (orderError) throw orderError;
  if (itemsError) throw itemsError;

  const itemsSum = (items || []).reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);
  const discountAmount = Number(order.discount_amount) || 0;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const taxRate = resolveTaxRate(settings, paymentMethod);
  return Number(((itemsSum - discountAmount) * (1 + taxRate) + deliveryFee).toFixed(2));
}

async function fetchOrderWithItems(orderId) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  return mapOrder(order, items || []);
}

export const db = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      icon: row.icon,
      imageURL: row.image_url || '',
      parentId: row.parent_id || null,
    }));
  },

  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_modifiers(*), product_sizes(*), product_addons(sort_order, addons(*))')
      .order('name');

    if (error) throw error;

    return (data || []).map((row) => {
      const modifiers = (row.product_modifiers || []).sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const sizes = (row.product_sizes || []).sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const addons = (row.product_addons || []).sort(
        (a, b) => a.sort_order - b.sort_order
      );
      return mapProduct(row, modifiers, sizes, addons);
    });
  },

  async getDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select('*, deal_items(*)')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return (data || []).map((row) => {
      const items = (row.deal_items || []).sort((a, b) => a.sort_order - b.sort_order);
      return mapDeal(row, items);
    });
  },

  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => mapOrder(row, row.order_items || []));
  },

  async getSiteSettings() {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) throw error;

    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return {
      taxRate: settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : 0.05,
      taxByPaymentEnabled: settings.tax_by_payment_enabled === 'true',
      cashTaxRate: settings.cash_tax_rate !== undefined ? parseFloat(settings.cash_tax_rate) : 0.16,
      cardTaxRate: settings.card_tax_rate !== undefined ? parseFloat(settings.card_tax_rate) : 0.05,
      memberDiscountPercent: settings.member_discount_percent !== undefined ? parseFloat(settings.member_discount_percent) : 10,
      contactPhone: settings.contact_phone || '',
      contactEmail: settings.contact_email || '',
      contactAddress: settings.contact_address || '',
      openHours: settings.open_hours || '',
      shopLat: settings.shop_lat ? parseFloat(settings.shop_lat) : null,
      shopLng: settings.shop_lng ? parseFloat(settings.shop_lng) : null,
      deliveryRadiusKm: settings.delivery_radius_km !== undefined ? parseFloat(settings.delivery_radius_km) : 5,
      deliveryFreeMinAmount: settings.delivery_free_min_amount !== undefined ? parseFloat(settings.delivery_free_min_amount) : 0,
      deliveryFreeMaxDistance: settings.delivery_free_max_distance !== undefined ? parseFloat(settings.delivery_free_max_distance) : 0,
      deliveryBaseFee: settings.delivery_base_fee !== undefined ? parseFloat(settings.delivery_base_fee) : 0,
      deliveryPerKmRate: settings.delivery_per_km_rate !== undefined ? parseFloat(settings.delivery_per_km_rate) : 0,
      deliveryMaxDistance: settings.delivery_max_distance !== undefined ? parseFloat(settings.delivery_max_distance) : 0,
      deliveryChargeType: settings.delivery_charge_type || 'per_km',
    };
  },

  async createOrder(order) {
    const { items = [], ...orderFields } = order;

    const totalAmount = Number(orderFields.totalAmount);
    if (!Number.isFinite(totalAmount)) {
      throw new Error(`Invalid total_amount: ${JSON.stringify(orderFields.totalAmount)}`);
    }

    const payload = {
      customer_name: orderFields.customerName,
      customer_phone: orderFields.customerPhone || '',
      status: orderFields.status || 'Pending',
      total_amount: totalAmount,
      delivery_fee: orderFields.deliveryFee || 0,
      order_type: orderFields.orderType || 'Dine-in',
      // Payment method is decided later -- when the customer bill is first
      // printed -- since sales tax depends on it and it's unknown yet at
      // send-to-kitchen time.
      payment_method: orderFields.paymentMethod ?? null,
      delivery_address: orderFields.deliveryAddress || '',
      table_number: orderFields.tableNumber || '',
      is_paid: orderFields.isPaid ?? false,
      source: 'POS',
      customer_id: orderFields.customerId || null,
      discount_amount: orderFields.discountAmount || 0,
    };

    // id is server-assigned (sequential, see assign_sequential_order_id
    // trigger) -- insert without one and read back whatever got assigned.
    const { data: inserted, error: orderError } = await supabase.from('orders').insert(payload).select('id').single();
    if (orderError) {
      const detail = orderError.details ? ` (${orderError.details})` : '';
      throw new Error(`Orders insert failed: ${orderError.message}${detail}`);
    }
    const id = inserted.id;

    if (items.length > 0) {
      const rows = items.map((item) => ({
        order_id: id,
        product_id: item.productId || item.productID || null,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice ?? item.price ?? 0,
        original_unit_price: item.originalPrice ?? null,
        notes: item.notes || '',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(rows);
      if (itemsError) {
        const detail = itemsError.details ? ` (${itemsError.details})` : '';
        throw new Error(`Order items insert failed: ${itemsError.message}${detail}`);
      }
    }

    return fetchOrderWithItems(id);
  },

  async updateOrderStatus(id, status, cancelReason) {
    const payload = { status };
    if (cancelReason !== undefined) payload.cancel_reason = cancelReason;
    const { error } = await supabase.from('orders').update(payload).eq('id', id);
    if (error) throw error;
    return fetchOrderWithItems(id);
  },

  // If the payment method wasn't already locked in (see setOrderPaymentMethod),
  // or the cashier changes it here (e.g. customer ends up paying by card
  // instead of what was printed on the bill), recompute the total for tax.
  async markOrderPaid(id, paymentMethod) {
    const settings = await this.getSiteSettings();
    const totalAmount = await computeTotalForPaymentMethod(id, paymentMethod, settings);

    const { error } = await supabase
      .from('orders')
      .update({ is_paid: true, payment_method: paymentMethod, status: 'Completed', total_amount: totalAmount })
      .eq('id', id);
    if (error) throw error;
    return fetchOrderWithItems(id);
  },

  // Called the first time a customer bill is printed for an order (payment
  // method is unknown -- and no tax applied -- until now, see createOrder).
  // Locks in the payment method and the tax rate that goes with it.
  async setOrderPaymentMethod(id, paymentMethod) {
    const settings = await this.getSiteSettings();
    const totalAmount = await computeTotalForPaymentMethod(id, paymentMethod, settings);

    const { error } = await supabase
      .from('orders')
      .update({ payment_method: paymentMethod, total_amount: totalAmount })
      .eq('id', id);
    if (error) throw error;
    return fetchOrderWithItems(id);
  },

  async getDeliveryZones() {
    const { data, error } = await supabase.from('delivery_zones').select('*').order('sort_order');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      minKm: Number(row.min_km),
      maxKm: Number(row.max_km),
      charge: Number(row.charge),
    }));
  },

  async getDeliveryAreas() {
    const { data, error } = await supabase.from('delivery_areas').select('*').order('sort_order');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      charge: Number(row.charge),
    }));
  },

  subscribeToRealtime(handlers) {
    if (typeof window === 'undefined') return () => {};

    const channel = supabase
      .channel('charbeast-pos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          try {
            const order = await fetchOrderWithItems(payload.new.id);
            handlers.order_created?.(order);
          } catch (err) {
            console.error('Failed to handle order_created event', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          try {
            const order = await fetchOrderWithItems(payload.new.id);
            handlers.order_updated?.(order);
          } catch (err) {
            console.error('Failed to handle order_updated event', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        async (payload) => {
          try {
            const { data } = await supabase
              .from('products')
              .select('*, product_modifiers(*), product_sizes(*), product_addons(sort_order, addons(*))')
              .eq('id', payload.new.id)
              .single();
            if (!data) return;
            const modifiers = (data.product_modifiers || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const sizes = (data.product_sizes || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const addons = (data.product_addons || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            handlers.product_created?.(mapProduct(data, modifiers, sizes, addons));
          } catch (err) {
            console.error('Failed to handle product_created event', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        async (payload) => {
          try {
            const { data } = await supabase
              .from('products')
              .select('*, product_modifiers(*), product_sizes(*), product_addons(sort_order, addons(*))')
              .eq('id', payload.new.id)
              .single();
            if (!data) return;
            const modifiers = (data.product_modifiers || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const sizes = (data.product_sizes || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const addons = (data.product_addons || []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            handlers.product_updated?.(mapProduct(data, modifiers, sizes, addons));
          } catch (err) {
            console.error('Failed to handle product_updated event', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          handlers.product_deleted?.({ id: payload.old.id });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        async () => {
          try {
            const deals = await db.getDeals();
            handlers.deals_updated?.(deals);
          } catch (err) {
            console.error('Failed to handle deals_updated event', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_settings' },
        async () => {
          try {
            const settings = await db.getSiteSettings();
            handlers.site_settings_updated?.(settings);
          } catch (err) {
            console.error('Failed to handle site_settings_updated event', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Supabase realtime channel error. Check project URL, anon key, and Realtime settings.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
