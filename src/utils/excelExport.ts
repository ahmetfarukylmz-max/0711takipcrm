/**
 * Excel Export Utilities
 *
 * Bu dosya Excel/CSV export işlemlerini yönetir.
 */

import * as XLSX from 'xlsx';
import type { Customer, Product, Order, Quote, Meeting, Shipment, ExportOptions } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Generic Excel Export fonksiyonu
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Data'
): void => {
  // Workbook oluştur
  const workbook = XLSX.utils.book_new();

  // Data'yı worksheet'e çevir
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Worksheet'i workbook'a ekle
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Column genişliklerini otomatik ayarla
  const maxWidth = 50;
  const wscols = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      ) + 2,
      maxWidth
    )
  }));
  worksheet['!cols'] = wscols;

  // Dosyayı indir
  XLSX.writeFile(workbook, filename);
};

/**
 * CSV Export fonksiyonu
 */
export const exportToCSV = (
  data: any[],
  filename: string
): void => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, filename, { bookType: 'csv' });
};

/**
 * Müşteri Listesi Export
 */
export const exportCustomers = (
  customers: Customer[],
  options: ExportOptions = {}
): void => {
  const { filename = 'musteriler.xlsx', includeDeleted = false } = options;

  // Silinenleri filtrele
  let filteredCustomers = customers;
  if (!includeDeleted) {
    filteredCustomers = customers.filter(c => !c.isDeleted);
  }

  // Export için format
  const exportData = filteredCustomers.map(customer => ({
    'Müşteri Adı': customer.name,
    'Yetkili Kişi': customer.contact_person || '',
    'Telefon': customer.phone,
    'E-posta': customer.email || '',
    'Adres': customer.address || '',
    'Şehir': customer.city || '',
    'Vergi Dairesi': customer.taxOffice || '',
    'Vergi No': customer.taxNumber || '',
    'Kayıt Tarihi': formatDate(customer.createdAt),
  }));

  exportToExcel(exportData, filename, 'Müşteriler');
};

/**
 * Ürün Listesi Export
 */
export const exportProducts = (
  products: Product[],
  options: ExportOptions = {}
): void => {
  const { filename = 'urunler.xlsx', includeDeleted = false } = options;

  // Silinenleri filtrele
  let filteredProducts = products;
  if (!includeDeleted) {
    filteredProducts = products.filter(p => !p.isDeleted);
  }

  // Export için format
  const exportData = filteredProducts.map(product => ({
    'Ürün Adı': product.name,
    'Maliyet Fiyatı': product.cost_price,
    'Satış Fiyatı': product.selling_price,
    'Kar Marjı (%)': (((product.selling_price - product.cost_price) / product.cost_price) * 100).toFixed(2),
    'Birim': product.unit,
    'Açıklama': product.description || '',
    'Kayıt Tarihi': formatDate(product.createdAt),
  }));

  exportToExcel(exportData, filename, 'Ürünler');
};

/**
 * Sipariş Listesi Export
 */
export const exportOrders = (
  orders: Order[],
  customers: Customer[],
  options: ExportOptions = {}
): void => {
  const { filename = 'siparisler.xlsx', includeDeleted = false } = options;

  // Silinenleri filtrele
  let filteredOrders = orders;
  if (!includeDeleted) {
    filteredOrders = orders.filter(o => !o.isDeleted);
  }

  // Tarih aralığı filtresi
  if (options.dateRange) {
    filteredOrders = filteredOrders.filter(order => {
      return order.order_date >= options.dateRange!.start &&
             order.order_date <= options.dateRange!.end;
    });
  }

  // Customer map oluştur
  const customerMap = new Map(customers.map(c => [c.id, c]));

  // Export için format
  const exportData = filteredOrders.map(order => {
    const customer = customerMap.get(order.customerId);
    const baseData: any = {
      'Sipariş No': order.id,
      'Müşteri': customer?.name || order.customerName || 'Bilinmiyor',
      'Sipariş Tarihi': order.order_date,
      'Teslim Tarihi': order.delivery_date || '',
      'Durum': order.status,
      'Ara Toplam': order.subtotal,
      'KDV (%)': order.vatRate,
      'KDV Tutarı': order.vatAmount,
      'Toplam Tutar': order.total_amount,
      'Para Birimi': order.currency || 'TRY',
      'Ürün Sayısı': order.items.length,
      'Notlar': order.notes || '',
    };

    // İptal bilgilerini ekle
    if (order.status === 'İptal Edildi') {
      baseData['İptal Tarihi'] = order.cancelledAt || '';
      baseData['İptal Nedeni'] = order.cancellationReason || '';
      baseData['İptal Açıklaması'] = order.cancellationNotes || '';
      baseData['İptal Eden'] = order.cancelledByEmail || '';
    }

    return baseData;
  });

  exportToExcel(exportData, filename, 'Siparişler');
};

/**
 * Teklifler Export
 */
export const exportQuotes = (
  quotes: Quote[],
  customers: Customer[],
  options: ExportOptions = {}
): void => {
  const { filename = 'teklifler.xlsx', includeDeleted = false } = options;

  let filteredQuotes = quotes;
  if (!includeDeleted) {
    filteredQuotes = quotes.filter(q => !q.isDeleted);
  }

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const exportData = filteredQuotes.map(quote => {
    const customer = customerMap.get(quote.customerId);
    return {
      'Teklif No': quote.id,
      'Müşteri': customer?.name || quote.customerName || 'Bilinmiyor',
      'Teklif Tarihi': quote.teklif_tarihi,
      'Geçerlilik': quote.valid_until || '',
      'Durum': quote.status,
      'Ara Toplam': quote.subtotal,
      'KDV (%)': quote.vatRate,
      'KDV Tutarı': quote.vatAmount,
      'Toplam Tutar': quote.total_amount,
      'Para Birimi': quote.currency || 'TRY',
      'Siparişe Dönüştü': quote.orderId ? 'Evet' : 'Hayır',
      'Notlar': quote.notes || '',
    };
  });

  exportToExcel(exportData, filename, 'Teklifler');
};

/**
 * Görüşmeler Export
 */
export const exportMeetings = (
  meetings: Meeting[],
  customers: Customer[],
  options: ExportOptions = {}
): void => {
  const { filename = 'gorusmeler.xlsx', includeDeleted = false } = options;

  let filteredMeetings = meetings;
  if (!includeDeleted) {
    filteredMeetings = meetings.filter(m => !m.isDeleted);
  }

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const exportData = filteredMeetings.map(meeting => {
    const customer = customerMap.get(meeting.customerId);
    return {
      'Müşteri': customer?.name || meeting.customerName || 'Bilinmiyor',
      'Görüşme Tarihi': meeting.meeting_date,
      'Görüşme Saati': meeting.meeting_time || '',
      'Sonuç': meeting.outcome || '',
      'Notlar': meeting.notes || '',
      'Sonraki Aksiyon Tarihi': meeting.next_action_date || '',
      'Sonraki Aksiyon': meeting.next_action_notes || '',
      'Durum': meeting.status || '',
    };
  });

  exportToExcel(exportData, filename, 'Görüşmeler');
};

/**
 * Sevkiyatlar Export
 */
export const exportShipments = (
  shipments: Shipment[],
  orders: Order[],
  customers: Customer[],
  options: ExportOptions = {}
): void => {
  const { filename = 'sevkiyatlar.xlsx', includeDeleted = false } = options;

  let filteredShipments = shipments;
  if (!includeDeleted) {
    filteredShipments = shipments.filter(s => !s.isDeleted);
  }

  const orderMap = new Map(orders.map(o => [o.id, o]));
  const customerMap = new Map(customers.map(c => [c.id, c]));

  const exportData = filteredShipments.map(shipment => {
    const order = orderMap.get(shipment.orderId);
    const customer = order ? customerMap.get(order.customerId) : null;
    return {
      'Sevkiyat No': shipment.id,
      'Sipariş No': shipment.orderNumber || shipment.orderId,
      'Müşteri': customer?.name || shipment.customerName || 'Bilinmiyor',
      'Sevkiyat Tarihi': shipment.shipment_date,
      'Tahmini Teslimat': shipment.delivery_date || '',
      'Durum': shipment.status,
      'Kargo Firması': shipment.carrier || '',
      'Takip No': shipment.tracking_number || '',
      'Notlar': shipment.notes || '',
    };
  });

  exportToExcel(exportData, filename, 'Sevkiyatlar');
};

/**
 * Detaylı Sipariş Raporu (Ürünler ile birlikte)
 */
export const exportOrdersDetailed = (
  orders: Order[],
  customers: Customer[],
  products: Product[],
  options: ExportOptions = {}
): void => {
  const { filename = 'siparis-detayli.xlsx', includeDeleted = false } = options;

  let filteredOrders = orders;
  if (!includeDeleted) {
    filteredOrders = orders.filter(o => !o.isDeleted);
  }

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const productMap = new Map(products.map(p => [p.id, p]));

  // Her sipariş için ürünleri satır satır listele
  const exportData: any[] = [];

  filteredOrders.forEach(order => {
    const customer = customerMap.get(order.customerId);

    order.items.forEach((item, index) => {
      const product = productMap.get(item.productId);
      const rowData: any = {
        'Sipariş No': order.id,
        'Müşteri': customer?.name || order.customerName || 'Bilinmiyor',
        'Sipariş Tarihi': order.order_date,
        'Durum': order.status,
        'Ürün Sıra': index + 1,
        'Ürün Adı': product?.name || item.productName || 'Bilinmiyor',
        'Miktar': item.quantity,
        'Birim': item.unit || product?.unit || '',
        'Birim Fiyat': item.unit_price,
        'Satır Toplamı': item.quantity * item.unit_price,
        'Sipariş Toplamı': order.total_amount,
      };

      // İptal bilgilerini ekle
      if (order.status === 'İptal Edildi') {
        rowData['İptal Tarihi'] = order.cancelledAt || '';
        rowData['İptal Nedeni'] = order.cancellationReason || '';
      }

      exportData.push(rowData);
    });
  });

  exportToExcel(exportData, filename, 'Detaylı Siparişler');
};

/**
 * Özet Rapor Export (Dashboard verileri)
 */
export const exportSummaryReport = (
  data: {
    customers: Customer[];
    products: Product[];
    orders: Order[];
    quotes: Quote[];
    meetings: Meeting[];
    shipments: Shipment[];
  },
  options: ExportOptions = {}
): void => {
  const { filename = 'ozet-rapor.xlsx' } = options;

  const workbook = XLSX.utils.book_new();

  // Özet sayfası
  const summary = [
    ['TAKIP CRM - ÖZET RAPOR'],
    ['Rapor Tarihi:', formatDate(new Date().toISOString())],
    [''],
    ['KATEGORİ', 'TOPLAM'],
    ['Toplam Müşteri', data.customers.filter(c => !c.isDeleted).length],
    ['Toplam Ürün', data.products.filter(p => !p.isDeleted).length],
    ['Toplam Sipariş', data.orders.filter(o => !o.isDeleted).length],
    ['Toplam Teklif', data.quotes.filter(q => !q.isDeleted).length],
    ['Toplam Görüşme', data.meetings.filter(m => !m.isDeleted).length],
    ['Toplam Sevkiyat', data.shipments.filter(s => !s.isDeleted).length],
    [''],
    ['SİPARİŞ DURUMLARI'],
    ['Bekliyor', data.orders.filter(o => o.status === 'Bekliyor' && !o.isDeleted).length],
    ['Hazırlanıyor', data.orders.filter(o => o.status === 'Hazırlanıyor' && !o.isDeleted).length],
    ['Tamamlandı', data.orders.filter(o => o.status === 'Tamamlandı' && !o.isDeleted).length],
    [''],
    ['TOPLAM CİRO'],
    ['Toplam Sipariş Tutarı', data.orders.filter(o => !o.isDeleted).reduce((sum, o) => sum + o.total_amount, 0).toFixed(2) + ' TRY'],
    ['Toplam Teklif Tutarı', data.quotes.filter(q => !q.isDeleted).reduce((sum, q) => sum + q.total_amount, 0).toFixed(2) + ' TRY'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

  // Dosyayı indir
  XLSX.writeFile(workbook, filename);
};
