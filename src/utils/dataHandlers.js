// src/utils/dataHandlers.js

import {
  saveDocument,
  saveOrder,
  saveQuote,
  deleteDocument,
  undoDelete,
  deleteShipment,
  cancelOrder,
  markShipmentDelivered,
  convertQuoteToOrder,
} from '../services/firestoreService';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';
import { showSmartConfirm, showUndoableDelete } from '../utils/toastUtils';

// --- Save Handlers ---

export const saveCustomer = async (user, customerData, customers, logUserActivity) => {
  const action = customerData.id ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER';
  const details = {
    message: `Müşteri ${customerData.id ? 'güncellendi' : 'oluşturuldu'}: ${customerData.name}`,
    customerId: customerData.id,
  };
  if (!customerData.id) {
    customerData.createdBy = user.uid;
    customerData.createdByEmail = user.email;
  }
  await saveDocument(user.uid, 'customers', customerData);
  logUserActivity(action, details);
  toast.success(`Müşteri başarıyla ${customerData.id ? 'güncellendi' : 'kaydedildi'}!`);
};

export const saveProduct = async (user, productData, logUserActivity) => {
  const action = productData.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT';
  const details = {
    message: `Ürün ${productData.id ? 'güncellendi' : 'oluşturuldu'}: ${productData.name}`,
  };
  if (!productData.id) {
    productData.createdBy = user.uid;
    productData.createdByEmail = user.email;
  }
  await saveDocument(user.uid, 'products', productData);
  logUserActivity(action, details);
  toast.success(`Ürün başarıyla ${productData.id ? 'güncellendi' : 'kaydedildi'}!`);
};

export const saveOrderHandler = async (user, orderData, customers, logUserActivity) => {
  const customerName = customers.find((c) => c.id === orderData.customerId)?.name || '';
  const action = orderData.id ? 'UPDATE_ORDER' : 'CREATE_ORDER';
  const details = {
    message: `${customerName} için sipariş ${orderData.id ? 'güncellendi' : 'oluşturuldu'}`,
    amount: orderData.total_amount,
  };
  const isNewOrder = !orderData.id;
  if (isNewOrder) {
    orderData.createdBy = user.uid;
    orderData.createdByEmail = user.email;
  }
  await saveOrder(user.uid, orderData);
  logUserActivity(action, details);
  toast.success(`Sipariş başarıyla ${orderData.id ? 'güncellendi' : 'kaydedildi'}!`);
};

export const saveQuoteHandler = async (user, quoteData, customers, logUserActivity) => {
  const customerName = customers.find((c) => c.id === quoteData.customerId)?.name || '';
  const action = quoteData.id ? 'UPDATE_QUOTE' : 'CREATE_QUOTE';
  const details = {
    message: `${customerName} için teklif ${quoteData.id ? 'güncellendi' : 'oluşturuldu'}`,
    amount: quoteData.total_amount,
  };
  if (!quoteData.id) {
    quoteData.createdBy = user.uid;
    quoteData.createdByEmail = user.email;
  }
  await saveQuote(user.uid, quoteData);
  logUserActivity(action, details);
  toast.success(`Teklif başarıyla ${quoteData.id ? 'güncellendi' : 'kaydedildi'}!`);
};

export const saveMeetingHandler = async (user, meetingData, customers, logUserActivity) => {
  const customerName = customers.find((c) => c.id === meetingData.customerId)?.name || '';
  const action = meetingData.id ? 'UPDATE_MEETING' : 'CREATE_MEETING';
  const details = {
    message: `${customerName} ile görüşme ${meetingData.id ? 'güncellendi' : 'oluşturuldu'}`,
  };

  if (!meetingData.id) {
    meetingData.createdBy = user.uid;
    meetingData.createdByEmail = user.email;
  }

  // 1. Save Meeting
  const meetingId = await saveDocument(user.uid, 'gorusmeler', meetingData);

  // 2. Process Auto-Purchase Requests
  let purchaseRequestsCreated = 0;
  if (meetingData.inquiredProducts && meetingData.inquiredProducts.length > 0) {
    const requestsToCreate = meetingData.inquiredProducts.filter(
      (p) => p.createPurchaseRequest === true
    );

    if (requestsToCreate.length > 0) {
      const purchasePromises = requestsToCreate.map((product) => {
        const purchaseRequest = {
          productId: product.productId,
          productName: product.productName, // Denormalized name
          quantity: product.quantity || 1,
          unit: product.unit || 'Adet',
          customerId: meetingData.customerId, // Link to customer
          customerName: customerName,
          meetingId: meetingId, // Link to this meeting
          requestDate: new Date().toISOString().slice(0, 10),
          requestedBy: user.uid,
          requestedByEmail: user.email,
          priority: product.priority === 'Yüksek' ? 'Yüksek' : 'Orta',
          status: 'Talep Edildi',
          description: `Görüşme notu: ${product.notes || 'Otomatik oluşturuldu'}`,
          createdBy: user.uid,
          createdByEmail: user.email,
          createdAt: new Date().toISOString(),
          purchaseNumber: `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        return saveDocument(user.uid, 'purchase_requests', purchaseRequest);
      });

      await Promise.all(purchasePromises);
      purchaseRequestsCreated = requestsToCreate.length;
    }
  }

  logUserActivity(action, details);

  if (purchaseRequestsCreated > 0) {
    toast.success(`Görüşme ve ${purchaseRequestsCreated} adet satınalma talebi oluşturuldu!`);
  } else {
    toast.success(`Görüşme başarıyla ${meetingData.id ? 'güncellendi' : 'kaydedildi'}!`);
  }
};

export const saveCustomTaskHandler = async (user, customTaskData, logUserActivity) => {
  const action = customTaskData.id ? 'UPDATE_CUSTOM_TASK' : 'CREATE_CUSTOM_TASK';
  const details = {
    message: `Görev ${customTaskData.id ? 'güncellendi' : 'oluşturuldu'}: ${customTaskData.title}`,
  };
  if (!customTaskData.id) {
    customTaskData.createdByEmail = user.email;
  }
  await saveDocument(user.uid, 'customTasks', customTaskData);
  logUserActivity(action, details);
  toast.success(customTaskData.id ? 'Görev güncellendi!' : 'Görev eklendi!');
};

export const saveShipmentHandler = async (
  user,
  shipmentData,
  orders,
  customers,
  logUserActivity
) => {
  try {
    const { updatedOrder, ...cleanShipmentData } = shipmentData;
    if (updatedOrder) {
      await saveDocument(user.uid, 'orders', {
        id: cleanShipmentData.orderId,
        ...updatedOrder,
      });
      const order = orders.find((o) => o.id === cleanShipmentData.orderId);
      const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
      logUserActivity('UPDATE_ORDER', {
        message: `${customerName} siparişi sevkiyat sırasında otomatik güncellendi (Miktar Artışı)`,
        orderId: cleanShipmentData.orderId,
      });
      toast.success('Sipariş miktarı güncellendi.');
    }
    if (!cleanShipmentData.id) {
      cleanShipmentData.createdBy = user.uid;
      cleanShipmentData.createdByEmail = user.email;
    }
    await saveDocument(user.uid, 'shipments', cleanShipmentData);
    const order = orders.find((o) => o.id === cleanShipmentData.orderId);
    const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
    logUserActivity('CREATE_SHIPMENT', {
      message: `${customerName} müşterisinin siparişi için sevkiyat oluşturuldu`,
    });
    toast.success('Sevkiyat başarıyla kaydedildi!');
  } catch (error) {
    logger.error('Sevkiyat kaydedilemedi:', error);
    toast.error('Sevkiyat kaydedilemedi!');
  }
};

export const updateShipmentHandler = async (
  user,
  shipmentData,
  orders,
  customers,
  logUserActivity
) => {
  try {
    await saveDocument(user.uid, 'shipments', shipmentData);
    const order = orders.find((o) => o.id === shipmentData.orderId);
    const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
    logUserActivity('UPDATE_SHIPMENT', {
      message: `${customerName} müşterisinin sevkiyatı güncellendi`,
    });
    toast.success('Sevkiyat başarıyla güncellendi!');
  } catch (error) {
    logger.error('Sevkiyat güncellenemedi:', error);
    toast.error('Sevkiyat güncellenemedi!');
  }
};

export const savePaymentHandler = async (user, paymentData, customers, logUserActivity) => {
  const action = paymentData.id ? 'UPDATE_PAYMENT' : 'CREATE_PAYMENT';
  const customerName = customers.find((c) => c.id === paymentData.customerId)?.name || '';
  const details = {
    message: `${customerName} için ödeme ${paymentData.id ? 'güncellendi' : 'oluşturuldu'}`,
    amount: paymentData.amount,
  };
  if (paymentData.id) {
    details.paymentId = paymentData.id;
  }
  if (!paymentData.id) {
    paymentData.createdBy = user.uid;
    paymentData.createdByEmail = user.email;
  }
  await saveDocument(user.uid, 'payments', paymentData);
  logUserActivity(action, details);
  toast.success(`Ödeme başarıyla ${paymentData.id ? 'güncellendi' : 'kaydedildi'}!`);
};

// --- Delete Handlers ---

export const deleteCustomerHandler = (
  user,
  customerId,
  customers,
  orders,
  teklifler,
  gorusmeler,
  logUserActivity
) => {
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return;

  const relatedOrders = orders.filter((o) => o.customerId === customerId && !o.isDeleted).length;
  const relatedQuotes = teklifler.filter((t) => t.customerId === customerId && !t.isDeleted).length;
  const relatedMeetings = gorusmeler.filter(
    (m) => m.customerId === customerId && !m.isDeleted
  ).length;
  const totalRelated = relatedOrders + relatedQuotes + relatedMeetings;

  showSmartConfirm({
    itemName: customer.name,
    itemType: 'müşteri',
    relatedCount: totalRelated,
    relatedType: totalRelated > 0 ? `sipariş/teklif/görüşme` : '',
    onConfirm: () => {
      deleteDocument(user.uid, 'customers', customerId).then(() => {
        logUserActivity('DELETE_CUSTOMER', { message: `Müşteri silindi: ${customer?.name}` });
        showUndoableDelete(`"${customer.name}" müşterisi silindi`, () => {
          undoDelete(user.uid, 'customers', customerId);
          logUserActivity('UNDO_DELETE_CUSTOMER', {
            message: `Müşteri geri alındı: ${customer?.name}`,
          });
        });
      });
    },
  });
};

export const deleteProductHandler = (user, productId, products, orders, logUserActivity) => {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const usedInOrders = orders.some(
    (o) => !o.isDeleted && o.items && o.items.some((item) => item.productId === productId)
  );

  showSmartConfirm({
    itemName: product.name,
    itemType: 'ürün',
    relatedCount: usedInOrders ? 1 : 0,
    relatedType: usedInOrders ? 'siparişte kullanılıyor' : '',
    onConfirm: () => {
      deleteDocument(user.uid, 'products', productId).then(() => {
        logUserActivity('DELETE_PRODUCT', { message: `Ürün silindi: ${product?.name}` });
        showUndoableDelete(`"${product.name}" ürünü silindi`, () => {
          undoDelete(user.uid, 'products', productId);
          logUserActivity('UNDO_DELETE_PRODUCT', {
            message: `Ürün geri alındı: ${product?.name}`,
          });
        });
      });
    },
  });
};

export const deleteOrderHandler = (
  user,
  orderId,
  orders,
  customers,
  shipments,
  logUserActivity
) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const customer = customers.find((c) => c.id === order?.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';
  const relatedShipments = shipments.filter((s) => s.orderId === orderId && !s.isDeleted).length;

  showSmartConfirm({
    itemName: `${customerName} - Sipariş`,
    itemType: 'sipariş',
    relatedCount: relatedShipments,
    relatedType: relatedShipments > 0 ? 'sevkiyat' : '',
    onConfirm: () => {
      deleteDocument(user.uid, 'orders', orderId).then(() => {
        logUserActivity('DELETE_ORDER', {
          message: `${customerName} müşterisinin siparişi silindi`,
        });
        showUndoableDelete(`${customerName} müşterisinin siparişi silindi`, () => {
          undoDelete(user.uid, 'orders', orderId);
          logUserActivity('UNDO_DELETE_ORDER', {
            message: `Sipariş geri alındı: ${customerName}`,
          });
        });
      });
    },
  });
};

export const deleteQuoteHandler = (user, quoteId, teklifler, customers, logUserActivity) => {
  const quote = teklifler.find((q) => q.id === quoteId);
  if (!quote) return;

  const customer = customers.find((c) => c.id === quote?.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';

  showSmartConfirm({
    itemName: `${customerName} - Teklif`,
    itemType: 'teklif',
    onConfirm: () => {
      deleteDocument(user.uid, 'teklifler', quoteId).then(() => {
        logUserActivity('DELETE_QUOTE', {
          message: `${customerName} müşterisinin teklifi silindi`,
        });
        showUndoableDelete(`${customerName} müşterisinin teklifi silindi`, () => {
          undoDelete(user.uid, 'teklifler', quoteId);
          logUserActivity('UNDO_DELETE_QUOTE', {
            message: `Teklif geri alındı: ${customerName}`,
          });
        });
      });
    },
  });
};

export const deleteMeetingHandler = (user, meetingId, gorusmeler, customers, logUserActivity) => {
  const meeting = gorusmeler.find((m) => m.id === meetingId);
  if (!meeting) return;

  const customer = customers.find((c) => c.id === meeting?.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';

  showSmartConfirm({
    itemName: `${customerName} - Görüşme`,
    itemType: 'görüşme',
    onConfirm: () => {
      deleteDocument(user.uid, 'gorusmeler', meetingId).then(() => {
        logUserActivity('DELETE_MEETING', {
          message: `${customerName} müşterisiyle olan görüşme silindi`,
        });
        showUndoableDelete(`${customerName} müşterisiyle olan görüşme silindi`, () => {
          undoDelete(user.uid, 'gorusmeler', meetingId);
          logUserActivity('UNDO_DELETE_MEETING', {
            message: `Görüşme geri alındı: ${customerName}`,
          });
        });
      });
    },
  });
};

export const deletePaymentHandler = (user, paymentId, payments, orders, logUserActivity) => {
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) return;

  const customerName = payment.customerName || 'Bilinmeyen müşteri';
  const relatedOrder = payment.orderId ? orders.find((o) => o.id === payment.orderId) : null;

  showSmartConfirm({
    itemName: `${customerName} - Ödeme`,
    itemType: 'ödeme',
    relatedCount: relatedOrder ? 1 : 0,
    relatedType: relatedOrder ? 'sipariş ile ilişkili' : '',
    onConfirm: () => {
      deleteDocument(user.uid, 'payments', paymentId).then(() => {
        logUserActivity('DELETE_PAYMENT', {
          message: `Ödeme silindi: ${customerName} - ${payment.amount}`,
        });
        showUndoableDelete(`${customerName} müşterisinin ödemesi silindi`, () => {
          undoDelete(user.uid, 'payments', paymentId);
          logUserActivity('UNDO_DELETE_PAYMENT', {
            message: `Ödeme geri alındı: ${customerName}`,
          });
        });
      });
    },
  });
};

export const deleteShipmentHandler = (
  user,
  shipmentId,
  shipments,
  orders,
  customers,
  logUserActivity
) => {
  const shipment = shipments.find((s) => s.id === shipmentId);
  if (!shipment) return;

  const order = orders.find((o) => o.id === shipment?.orderId);
  const customer = customers.find((c) => c.id === order?.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';

  showSmartConfirm({
    itemName: `${customerName} - Sevkiyat`,
    itemType: 'sevkiyat',
    onConfirm: () => {
      deleteShipment(user.uid, shipmentId, user.email).then((success) => {
        if (success) {
          toast.success('Sevkiyat silindi ve stoklar iade edildi.');
          showUndoableDelete(`${customerName} müşterisinin sevkiyatı silindi`, () => {
            undoDelete(user.uid, 'shipments', shipmentId);
            logUserActivity('UNDO_DELETE_SHIPMENT', {
              message: `Sevkiyat geri alındı: ${customerName}`,
            });
          });
        } else {
          toast.error('Sevkiyat silinirken bir hata oluştu.');
        }
      });
    },
  });
};

// --- Other Handlers ---

export const cancelOrderHandler = async (
  user,
  orderId,
  cancellationData,
  orders,
  customers,
  logUserActivity
) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const customer = customers.find((c) => c.id === order?.customerId);
  const customerName = customer?.name || 'Bilinmeyen müşteri';

  try {
    const success = await cancelOrder(user.uid, orderId, {
      ...cancellationData,
      cancelledByEmail: user.email,
    });

    if (success) {
      toast.success('Sipariş başarıyla iptal edildi');
      logUserActivity('CANCEL_ORDER', {
        message: `${customerName} müşterisinin siparişi iptal edildi`,
        orderId: orderId,
        reason: cancellationData.reason,
        amount: order.total_amount,
      });
    } else {
      toast.error('Sipariş iptal edilemedi');
    }
  } catch (error) {
    logger.error('Cancel order error:', error);
    toast.error('Bir hata oluştu');
  }
};

export const convertToOrderHandler = async (user, quote, customers, logUserActivity) => {
  await convertQuoteToOrder(user.uid, quote);
  const customerName = customers.find((c) => c.id === quote.customerId)?.name || '';
  logUserActivity('CONVERT_QUOTE_TO_ORDER', {
    message: `${customerName} müşterisinin teklifi siparişe dönüştürüldü`,
    amount: quote.total_amount,
  });
  toast.success(`Teklif başarıyla siparişe dönüştürüldü: ${customerName}`);
};

export const markShipmentDeliveredHandler = async (
  user,
  shipmentId,
  shipments,
  orders,
  customers,
  logUserActivity
) => {
  const shipment = shipments.find((s) => s.id === shipmentId);
  if (shipment) {
    await markShipmentDelivered(user.uid, shipmentId, shipment.orderId, user.email);
    const order = orders.find((o) => o.id === shipment.orderId);
    const customerName = customers.find((c) => c.id === order?.customerId)?.name || '';
    logUserActivity('MARK_SHIPMENT_DELIVERED', {
      message: `${customerName} müşterisinin sevkiyatı teslim edildi olarak işaretlendi`,
    });
    toast.success('Sevkiyat teslim edildi olarak işaretlendi!');
  }
};

export const createQuoteFromMeetingHandler = (
  customerId,
  inquiredProducts,
  products,
  setPrefilledQuote,
  navigateToPage
) => {
  // Convert inquired products to quote items
  const quoteItems = inquiredProducts
    .filter((ip) => ip.productId)
    .map((ip) => {
      const product = products.find((p) => p.id === ip.productId);
      if (!product) return null;

      return {
        productId: ip.productId,
        productName: ip.productName,
        quantity: ip.quantity || 1,
        unit: ip.unit || product.unit || 'Adet',
        unitPrice: ip.priceQuoted || product.price || 0,
        totalPrice: (ip.quantity || 1) * (ip.priceQuoted || product.price || 0),
      };
    })
    .filter((item) => item !== null);

  if (quoteItems.length === 0) {
    toast.error('Teklif oluşturmak için en az bir geçerli ürün gerekli');
    return;
  }

  // Calculate totals
  const subtotal = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const vatRate = 20; // Default VAT rate
  const vatAmount = (subtotal * vatRate) / 100;
  const total_amount = subtotal + vatAmount;

  // Create prefilled quote
  const newQuote = {
    customerId,
    items: quoteItems,
    subtotal,
    vatRate,
    vatAmount,
    total_amount,
    quote_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days
    status: 'Hazırlandı',
    currency: 'TRY',
  };

  // Set prefilled quote and navigate to Quotes page
  setPrefilledQuote(newQuote);
  navigateToPage('Teklifler');
  toast.success(`${quoteItems.length} ürünle teklif oluşturuluyor...`);
};

export const createQuoteFromPurchaseHandler = (request, setPrefilledQuote) => {
  if (!request.customerId) {
    toast.error('Bu talep bir müşteriye bağlı değil.');
    return false;
  }

  // Determine unit price (use approved offer price or manual unit price, fallback to 0)
  // Add a default markup (e.g., 20%) if cost is known
  const costPrice = request.unitPrice || 0;
  const markupRate = 1.2; // 20% markup default
  const salesPrice = costPrice * markupRate;

  const quoteItem = {
    productId: request.productId,
    productName: request.productName,
    quantity: request.quantity || 1,
    unit: request.unit || 'Adet',
    unitPrice: salesPrice, // Suggested sales price
    totalPrice: (request.quantity || 1) * salesPrice,
    costPrice: costPrice, // Track cost for margin analysis later
  };

  const vatRate = 20;
  const vatAmount = (quoteItem.totalPrice * vatRate) / 100;
  const total_amount = quoteItem.totalPrice + vatAmount;

  const newQuote = {
    customerId: request.customerId,
    items: [quoteItem],
    subtotal: quoteItem.totalPrice,
    vatRate,
    vatAmount,
    total_amount,
    quote_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Hazırlandı',
    currency: request.currency || 'TRY',
    notes: `Satınalma Talebi Referansı: #${request.purchaseNumber || request.id.slice(0, 4)}`,
  };

  setPrefilledQuote(newQuote);
  toast.success('Satınalma verileriyle teklif taslağı oluşturuluyor...');
  return true;
};
