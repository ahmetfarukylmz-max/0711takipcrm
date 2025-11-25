import React, { useMemo, useState, useCallback } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    CalendarIcon,
    TrendingUpIcon,
    UsersIcon,
    DocumentTextIcon,
    ClipboardListIcon,
    TruckIcon,
    DownloadIcon,
    ChevronDownIcon,
    BoxIcon,
    CurrencyDollarIcon
} from '../icons';
import { MetricCard, DetailAccordion } from './shared';

// Detaylı Liste Öğesi
// eslint-disable-next-line no-unused-vars
const DetailListItem = ({ customer, items, total, date, notes, type, getProductName, paymentType, paymentTerm, checkBank, checkNumber, checkDate }) => {
    const [showItems, setShowItems] = useState(false);

    // Ödeme tipi badge rengi
    const getPaymentTypeBadge = (type) => {
        switch(type) {
            case 'Peşin':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'Vadeli':
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
            case 'Çek':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{customer}</h4>
                    {date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
                    )}

                    {/* Ödeme Şekli */}
                    {paymentType && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPaymentTypeBadge(paymentType)}`}>
                                💳 {paymentType}
                                {paymentType === 'Vadeli' && paymentTerm && ` (${paymentTerm} gün)`}
                            </span>
                            {paymentType === 'Çek' && (checkBank || checkNumber) && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {checkBank && `🏦 ${checkBank}`}
                                    {checkNumber && ` #${checkNumber}`}
                                    {checkDate && ` - Vade: ${formatDate(checkDate)}`}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Notlar */}
                    {notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                            📝 {notes}
                        </p>
                    )}
                </div>
                {total && (
                    <div className="text-right">
                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {formatCurrency(total)}
                        </p>
                    </div>
                )}
            </div>

            {items && items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => setShowItems(!showItems)}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                        <BoxIcon className="w-4 h-4" />
                        <span>{items.length} ürün {showItems ? 'gizle' : 'göster'}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${showItems ? 'rotate-180' : ''}`} />
                    </button>

                    {showItems && (
                        <div className="mt-3 space-y-2">
                            {items.map((item, idx) => {
                                // Ürün adını ID'den al
                                const productName = item.productId && getProductName
                                    ? getProductName(item.productId)
                                    : (item.productName || item.name || 'Ürün');

                                return (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                {productName}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {item.quantity} {item.unit || 'Kg'} × {formatCurrency(item.unit_price || 0)}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 ml-4">
                                            {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const EnhancedDailyReportWithDetails = ({ orders, quotes, meetings, shipments, customers, products, payments }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateRange, setDateRange] = useState('today');
    const [openAccordion, setOpenAccordion] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Performance: Create lookup maps (O(1) instead of O(n) for each lookup)
    const customerMap = useMemo(() => {
        const map = new Map();
        customers?.forEach(c => map.set(c.id, c.name));
        return map;
    }, [customers]);

    const productMap = useMemo(() => {
        const map = new Map();
        products?.forEach(p => {
            if (!p.isDeleted) {
                map.set(p.id, p.name);
            }
        });
        return map;
    }, [products]);

    // Yardımcı fonksiyon: Müşteri adını ID'den bul (O(1) lookup)
    const getCustomerName = useCallback((customerId) => {
        return customerMap.get(customerId) || `Müşteri ID: ${customerId}`;
    }, [customerMap]);

    // Yardımcı fonksiyon: Ürün adını ID'den bul (O(1) lookup)
    const getProductName = useCallback((productId) => {
        return productMap.get(productId) || 'Bilinmeyen Ürün';
    }, [productMap]);

    // Veri filtreleme ve hesaplama fonksiyonu
    const getDetailedDataForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);

        const dayMeetings = meetings.filter(m => !m.isDeleted && m.meeting_date === dateStr);
        const dayQuotes = quotes.filter(q => !q.isDeleted && q.teklif_tarihi === dateStr);
        const dayOrders = orders.filter(o => !o.isDeleted && o.order_date === dateStr);
        const convertedOrders = dayOrders.filter(o => o.quoteId);
        const dayShipments = shipments.filter(s => !s.isDeleted && s.shipment_date === dateStr);
        const dayDeliveries = shipments.filter(s => !s.isDeleted && s.delivery_date === dateStr);

        // Tahsilat hesaplamaları
        const dailyPayments = payments ? payments.filter(p => !p.isDeleted && p.paidDate === dateStr && p.status === 'Tahsil Edildi') : [];
        const dailyPaymentsValue = dailyPayments.reduce((sum, p) => {
            const amount = p.amount || 0;
            const inTRY = p.currency === 'USD' ? amount * 35 :
                         p.currency === 'EUR' ? amount * 38 :
                         amount;
            return sum + inTRY;
        }, 0);

        return {
            meetings: dayMeetings,
            quotes: dayQuotes,
            allOrders: dayOrders,
            convertedOrders: convertedOrders,
            shipments: dayShipments,
            deliveries: dayDeliveries,
            payments: dailyPayments,
            stats: {
                newMeetings: dayMeetings.length,
                newQuotes: dayQuotes.length,
                newQuotesValue: dayQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0),
                convertedOrders: convertedOrders.length,
                convertedOrdersValue: convertedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                allOrders: dayOrders.length,
                allOrdersValue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                newShipments: dayShipments.length,
                completedDeliveries: dayDeliveries.length,
                collectedPayments: dailyPayments.length,
                collectedPaymentsValue: dailyPaymentsValue,
            }
        };
    };

    // Bugün ve dün verilerini hesapla
    const todayData = useMemo(() => getDetailedDataForDate(selectedDate), [
        orders, quotes, meetings, shipments, payments, selectedDate
    ]);

    const yesterdayData = useMemo(() => {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        return getDetailedDataForDate(yesterday);
    }, [orders, quotes, meetings, shipments, payments, selectedDate]);

    // Dönüşüm oranı
    const conversionRate = todayData.stats.newQuotes > 0
        ? ((todayData.stats.convertedOrders / todayData.stats.newQuotes) * 100).toFixed(1)
        : 0;
    const yesterdayConversionRate = yesterdayData.stats.newQuotes > 0
        ? ((yesterdayData.stats.convertedOrders / yesterdayData.stats.newQuotes) * 100).toFixed(1)
        : 0;

    // Tarih değiştirme
    const handleDateRangeChange = useCallback((range) => {
        setDateRange(range);
        const today = new Date();

        switch(range) {
            case 'today':
                setSelectedDate(today.toISOString().slice(0, 10));
                break;
            case 'yesterday':
                today.setDate(today.getDate() - 1);
                setSelectedDate(today.toISOString().slice(0, 10));
                break;
            default:
                setSelectedDate(today.toISOString().slice(0, 10));
        }
    }, []);

    // Modern PDF Export fonksiyonu - html2canvas ile Türkçe karakter desteği
    const handleExportPdf = useCallback(async () => {
        setIsGeneratingPdf(true);
        try {
            // PDF için özel bir container oluştur
            const pdfContainer = document.createElement('div');
            pdfContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: 794px;
                background: white;
                padding: 40px;
                font-family: Arial, sans-serif;
            `;

            // İçeriği oluştur
            pdfContainer.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #1f2937;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">AKÇELİK METAL SANAYİ</h1>
                                <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.9;">Organize Sanayi Bölgesi, Bursa | Tel: 0224 123 45 67</p>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="margin: 0; font-size: 20px; font-weight: bold;">GÜNLÜK PERFORMANS RAPORU</h2>
                                <p style="margin: 8px 0 0 0; font-size: 14px;">${formatDate(selectedDate)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Performans Metrikleri -->
                    <h3 style="color: #1e3a8a; font-size: 18px; margin: 0 0 16px 0; font-weight: bold;">📊 PERFORMANS METRİKLERİ</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 14px; color: #1e40af; margin-bottom: 8px;">Müşteri Görüşmeleri</div>
                            <div style="font-size: 32px; font-weight: bold; color: #1e3a8a;">${todayData.stats.newMeetings}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">adet</div>
                        </div>
                        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; border-left: 4px solid #a855f7;">
                            <div style="font-size: 14px; color: #7c3aed; margin-bottom: 8px;">Oluşturulan Teklifler</div>
                            <div style="font-size: 32px; font-weight: bold; color: #6b21a8;">${todayData.stats.newQuotes}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${formatCurrency(todayData.stats.newQuotesValue)}</div>
                        </div>
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
                            <div style="font-size: 14px; color: #16a34a; margin-bottom: 8px;">Onaylanan Siparişler</div>
                            <div style="font-size: 32px; font-weight: bold; color: #15803d;">${todayData.stats.allOrders}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${formatCurrency(todayData.stats.allOrdersValue)}</div>
                        </div>
                        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <div style="font-size: 14px; color: #059669; margin-bottom: 8px;">Tahsil Edilen</div>
                            <div style="font-size: 32px; font-weight: bold; color: #047857;">${todayData.stats.collectedPayments}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${formatCurrency(todayData.stats.collectedPaymentsValue)}</div>
                        </div>
                        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
                            <div style="font-size: 14px; color: #ea580c; margin-bottom: 8px;">Dönüşüm Oranı</div>
                            <div style="font-size: 32px; font-weight: bold; color: #c2410c;">${conversionRate}%</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Teklif → Sipariş</div>
                        </div>
                    </div>

                    ${todayData.meetings && todayData.meetings.length > 0 ? `
                    <!-- Müşteri Görüşmeleri -->
                    <h3 style="color: #1e3a8a; font-size: 16px; margin: 32px 0 16px 0; font-weight: bold;">👥 MÜŞTERİ GÖRÜŞMELERİ (${todayData.meetings.length})</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="background: #3b82f6; color: white;">
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #2563eb;">Müşteri Adı</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #2563eb;">Tarih</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #2563eb;">Notlar / Sonuç</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayData.meetings.map((meeting, idx) => `
                                <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${getCustomerName(meeting.customerId)}</td>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${formatDate(meeting.meeting_date)}</td>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${meeting.notes || meeting.outcome || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}

                    ${todayData.quotes && todayData.quotes.length > 0 ? `
                    <!-- Oluşturulan Teklifler -->
                    <h3 style="color: #1e3a8a; font-size: 16px; margin: 32px 0 16px 0; font-weight: bold;">📄 OLUŞTURULAN TEKLİFLER (${todayData.quotes.length})</h3>
                    ${todayData.quotes.map((quote) => `
                        <div style="margin-bottom: 20px; border: 2px solid #a855f7; border-radius: 8px; overflow: hidden;">
                            <div style="background: #a855f7; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 14px;">#${quote.id.substring(0, 8).toUpperCase()}</strong>
                                    <span style="margin-left: 12px; font-size: 13px;">${getCustomerName(quote.customerId)}</span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 16px; font-weight: bold;">${formatCurrency(quote.total_amount)}</div>
                                    <div style="font-size: 11px; opacity: 0.9;">${formatDate(quote.teklif_tarihi)} | ${quote.status || 'Bekliyor'}</div>
                                </div>
                            </div>
                            ${quote.items && quote.items.length > 0 ? `
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #faf5ff;">
                                            <th style="padding: 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #6b21a8;">Ürün</th>
                                            <th style="padding: 8px; text-align: center; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #6b21a8;">Miktar</th>
                                            <th style="padding: 8px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #6b21a8;">Birim Fiyat</th>
                                            <th style="padding: 8px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #6b21a8;">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${quote.items.map((item, itemIdx) => `
                                            <tr style="background: ${itemIdx % 2 === 0 ? '#ffffff' : '#fafafa'};">
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px;">${getProductName(item.productId)}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: center;">${item.quantity} ${item.unit || 'Kg'}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: right;">${formatCurrency(item.unit_price || 0)}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: right; font-weight: bold;">${formatCurrency((item.quantity || 0) * (item.unit_price || 0))}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<div style="padding: 12px; color: #64748b; font-size: 11px; font-style: italic;">Ürün detayı bulunmuyor</div>'}
                        </div>
                    `).join('')}
                    ` : ''}

                    ${todayData.allOrders && todayData.allOrders.length > 0 ? `
                    <!-- Onaylanan Siparişler -->
                    <h3 style="color: #1e3a8a; font-size: 16px; margin: 32px 0 16px 0; font-weight: bold;">✅ ONAYLANAN SİPARİŞLER (${todayData.allOrders.length})</h3>
                    ${todayData.allOrders.map((order) => `
                        <div style="margin-bottom: 20px; border: 2px solid #22c55e; border-radius: 8px; overflow: hidden;">
                            <div style="background: #22c55e; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 14px;">#${order.id.substring(0, 8).toUpperCase()}</strong>
                                    <span style="margin-left: 12px; font-size: 13px;">${getCustomerName(order.customerId)}</span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 16px; font-weight: bold;">${formatCurrency(order.total_amount)}</div>
                                    <div style="font-size: 11px; opacity: 0.9;">${formatDate(order.order_date)} | ${order.quoteId ? '✓ Tekliften' : (order.status || 'Bekliyor')}</div>
                                </div>
                            </div>
                            ${order.items && order.items.length > 0 ? `
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #f0fdf4;">
                                            <th style="padding: 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #15803d;">Ürün</th>
                                            <th style="padding: 8px; text-align: center; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #15803d;">Miktar</th>
                                            <th style="padding: 8px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #15803d;">Birim Fiyat</th>
                                            <th style="padding: 8px; text-align: right; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #15803d;">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.items.map((item, itemIdx) => `
                                            <tr style="background: ${itemIdx % 2 === 0 ? '#ffffff' : '#fafafa'};">
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px;">${getProductName(item.productId)}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: center;">${item.quantity} ${item.unit || 'Kg'}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: right;">${formatCurrency(item.unit_price || 0)}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; text-align: right; font-weight: bold;">${formatCurrency((item.quantity || 0) * (item.unit_price || 0))}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<div style="padding: 12px; color: #64748b; font-size: 11px; font-style: italic;">Ürün detayı bulunmuyor</div>'}
                        </div>
                    `).join('')}
                    ` : ''}

                    ${todayData.shipments && todayData.shipments.length > 0 ? `
                    <!-- Sevkiyatlar -->
                    <h3 style="color: #1e3a8a; font-size: 16px; margin: 32px 0 16px 0; font-weight: bold;">🚚 OLUŞTURULAN SEVKİYATLAR (${todayData.shipments.length})</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="background: #fb923c; color: white;">
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #f97316;">Müşteri</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #f97316;">Sevkiyat Tarihi</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #f97316;">Durum</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #f97316;">Teslimat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayData.shipments.map((shipment, idx) => {
                                const relatedOrder = orders.find(o => o.id === shipment.orderId);
                                const customerName = relatedOrder ? getCustomerName(relatedOrder.customerId) : 'Bilinmiyor';
                                return `
                                    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${customerName}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${formatDate(shipment.shipment_date)}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${shipment.status}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px;">${shipment.delivery_date ? formatDate(shipment.delivery_date) : '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ` : ''}

                    ${todayData.payments && todayData.payments.length > 0 ? `
                    <!-- Tahsil Edilen Ödemeler -->
                    <h3 style="color: #1e3a8a; font-size: 16px; margin: 32px 0 16px 0; font-weight: bold;">💰 TAHSİL EDİLEN ÖDEMELER (${todayData.payments.length})</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="background: #10b981; color: white;">
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #059669;">Müşteri Adı</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #059669;">Tutar</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #059669;">Ödeme Yöntemi</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border: 1px solid #059669;">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayData.payments.map((payment, idx) => {
                                const amount = payment.amount || 0;
                                const currency = payment.currency || 'TRY';
                                const inTRY = currency === 'USD' ? amount * 35 :
                                            currency === 'EUR' ? amount * 38 :
                                            amount;
                                return `
                                    <tr style="background: ${idx % 2 === 0 ? '#ecfdf5' : 'white'};">
                                        <td style="padding: 10px; border: 1px solid #d1fae5; font-size: 12px;">${getCustomerName(payment.customerId)}</td>
                                        <td style="padding: 10px; border: 1px solid #d1fae5; font-size: 12px; font-weight: bold;">${formatCurrency(inTRY)}</td>
                                        <td style="padding: 10px; border: 1px solid #d1fae5; font-size: 12px;">${payment.paymentMethod || 'Belirtilmemiş'}</td>
                                        <td style="padding: 10px; border: 1px solid #d1fae5; font-size: 12px;">${formatDate(payment.paidDate)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ` : ''}

                    <!-- Performans Özeti -->
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 24px; border-radius: 12px; margin-top: 32px; color: white;">
                        <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">📈 GÜNLÜK PERFORMANS ÖZETİ</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div style="background: rgba(255,255,255,0.15); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">Gelir Potansiyeli</div>
                                <div style="font-size: 24px; font-weight: bold;">${formatCurrency(todayData.stats.newQuotesValue)}</div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">${todayData.stats.newQuotes} teklif</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">Gerçekleşen Gelir</div>
                                <div style="font-size: 24px; font-weight: bold;">${formatCurrency(todayData.stats.allOrdersValue)}</div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">${todayData.stats.allOrders} sipariş</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">Başarı Oranı</div>
                                <div style="font-size: 24px; font-weight: bold;">${conversionRate}%</div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">${todayData.stats.convertedOrders}/${todayData.stats.newQuotes} onaylandı</div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 32px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">
                        <p style="margin: 0;">AKÇELİK METAL SANAYİ - Günlük Performans Raporu</p>
                        <p style="margin: 4px 0 0 0;">Rapor Tarihi: ${formatDate(selectedDate)}</p>
                    </div>
                </div>
            `;

            document.body.appendChild(pdfContainer);

            // html2canvas ile görüntüye çevir
            const canvas = await html2canvas(pdfContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794,
                windowHeight: pdfContainer.scrollHeight,
            });

            document.body.removeChild(pdfContainer);

            // PDF oluştur
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4',
                hotfixes: ['px_scaling']
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Canvas'ı PDF sayfasına sığacak şekilde ölçeklendir
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            // İlk sayfayı ekle
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            // Eğer içerik bir sayfadan uzunsa, yeni sayfalar ekle
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            pdf.save(`gunluk_performans_raporu_${selectedDate}.pdf`);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            alert('PDF oluştururken bir hata oluştu! Lütfen tekrar deneyin.');
        } finally {
            setIsGeneratingPdf(false);
        }
    }, [selectedDate, todayData, conversionRate, orders, getCustomerName, getProductName]);

    // CSV Export fonksiyonu
    const handleExportCsv = useCallback(() => {
        const data = [
            ['Günlük Performans Raporu', selectedDate],
            [''],
            ['Metrik', 'Değer', 'Önceki Gün', 'Değişim %'],
            ['Yeni Görüşmeler', todayData.stats.newMeetings, yesterdayData.stats.newMeetings, ''],
            ['Oluşturulan Teklifler', todayData.stats.newQuotes, yesterdayData.stats.newQuotes, ''],
            ['Teklif Tutarı', todayData.stats.newQuotesValue, yesterdayData.stats.newQuotesValue, ''],
            ['Siparişe Dönen Teklif', todayData.stats.convertedOrders, yesterdayData.stats.convertedOrders, ''],
            ['Tahsil Edilen Ödeme', todayData.stats.collectedPayments, yesterdayData.stats.collectedPayments, ''],
            ['Tahsil Edilen Tutar', todayData.stats.collectedPaymentsValue, yesterdayData.stats.collectedPaymentsValue, ''],
            ['Dönüşüm Oranı %', conversionRate, yesterdayConversionRate, ''],
        ];

        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gunluk_rapor_${selectedDate}.csv`;
        link.click();
    }, [selectedDate, todayData, yesterdayData, conversionRate, yesterdayConversionRate]);

    const toggleAccordion = useCallback((key) => {
        setOpenAccordion(prev => prev === key ? null : key);
    }, []);

    return (
        <div className="space-y-6">
            {/* Başlık ve Kontroller */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <CalendarIcon className="w-7 h-7 text-blue-500" />
                        Günlük Performans Raporu
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(selectedDate)} tarihli detaylı performans analizi
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 no-print">
                    {/* Tarih Seçici */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleDateRangeChange('yesterday')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                dateRange === 'yesterday'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Dün
                        </button>
                        <button
                            onClick={() => handleDateRangeChange('today')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                dateRange === 'today'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Bugün
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setDateRange('custom');
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-3 border-l border-gray-300 dark:border-gray-600 pl-3">
                        <button
                            onClick={handleExportPdf}
                            disabled={isGeneratingPdf}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Modern PDF Raporu İndir"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">
                                {isGeneratingPdf ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
                            </span>
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            title="CSV Olarak İndir"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span className="text-sm font-semibold">CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Ana Metrik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <MetricCard
                    title="Müşteri Görüşmeleri"
                    value={todayData.stats.newMeetings}
                    previousValue={yesterdayData.stats.newMeetings}
                    suffix=" adet"
                    icon={UsersIcon}
                    color="from-blue-500 to-blue-600"
                    details="Yeni müşteri toplantıları"
                    onClick={() => toggleAccordion('meetings')}
                />

                <MetricCard
                    title="Oluşturulan Teklifler"
                    value={todayData.stats.newQuotes}
                    previousValue={yesterdayData.stats.newQuotes}
                    suffix=" adet"
                    icon={DocumentTextIcon}
                    color="from-purple-500 to-purple-600"
                    details={formatCurrency(todayData.stats.newQuotesValue)}
                    onClick={() => toggleAccordion('quotes')}
                />

                <MetricCard
                    title="Onaylanan Siparişler"
                    value={todayData.stats.allOrders}
                    previousValue={yesterdayData.stats.allOrders}
                    suffix=" adet"
                    icon={ClipboardListIcon}
                    color="from-green-500 to-green-600"
                    details={formatCurrency(todayData.stats.allOrdersValue)}
                    onClick={() => toggleAccordion('orders')}
                />

                <MetricCard
                    title="Tahsil Edilen"
                    value={todayData.stats.collectedPayments}
                    previousValue={yesterdayData.stats.collectedPayments}
                    suffix=" adet"
                    icon={CurrencyDollarIcon}
                    color="from-emerald-500 to-emerald-600"
                    details={formatCurrency(todayData.stats.collectedPaymentsValue)}
                    onClick={() => toggleAccordion('payments')}
                />

                <MetricCard
                    title="Dönüşüm Oranı"
                    value={conversionRate}
                    previousValue={yesterdayConversionRate}
                    suffix="%"
                    icon={TrendingUpIcon}
                    color="from-orange-500 to-orange-600"
                    details="Teklif → Sipariş"
                />
            </div>

            {/* Detaylı Görünümler - Accordion */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mt-6 no-print">
                    <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                    Detaylı Görünüm
                </h3>

                {/* Görüşmeler Detayı */}
                <DetailAccordion
                    title="Müşteri Görüşmeleri"
                    icon={UsersIcon}
                    count={todayData.meetings.length}
                    isOpen={openAccordion === 'meetings'}
                    onToggle={() => toggleAccordion('meetings')}
                >
                    {todayData.meetings.length > 0 ? (
                        todayData.meetings.map((meeting) => (
                            <DetailListItem
                                key={meeting.id}
                                customer={getCustomerName(meeting.customerId)}
                                date={meeting.meeting_date}
                                notes={meeting.notes || meeting.outcome || 'Görüşme yapıldı'}
                                type="meeting"
                                getProductName={getProductName}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Bugün görüşme kaydı bulunmuyor.
                        </p>
                    )}
                </DetailAccordion>

                {/* Teklifler Detayı */}
                <DetailAccordion
                    title="Oluşturulan Teklifler"
                    icon={DocumentTextIcon}
                    count={todayData.quotes.length}
                    isOpen={openAccordion === 'quotes'}
                    onToggle={() => toggleAccordion('quotes')}
                >
                    {todayData.quotes.length > 0 ? (
                        todayData.quotes.map((quote) => (
                            <DetailListItem
                                key={quote.id}
                                customer={getCustomerName(quote.customerId)}
                                items={quote.items}
                                total={quote.total_amount}
                                date={quote.teklif_tarihi}
                                notes={quote.notes || `Durum: ${quote.status || 'Bekliyor'}`}
                                type="quote"
                                getProductName={getProductName}
                                paymentType={quote.paymentType}
                                paymentTerm={quote.paymentTerm}
                                checkBank={quote.checkBank}
                                checkNumber={quote.checkNumber}
                                checkDate={quote.checkDate}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Bugün teklif kaydı bulunmuyor.
                        </p>
                    )}
                </DetailAccordion>

                {/* Siparişler Detayı */}
                <DetailAccordion
                    title="Onaylanan Siparişler"
                    icon={ClipboardListIcon}
                    count={todayData.allOrders.length}
                    isOpen={openAccordion === 'orders'}
                    onToggle={() => toggleAccordion('orders')}
                >
                    {todayData.allOrders.length > 0 ? (
                        todayData.allOrders.map((order) => {
                            const noteText = order.notes || (order.quoteId ? '✓ Tekliften dönüştürüldü' : `Durum: ${order.status || 'Bekliyor'}`);
                            return (
                                <DetailListItem
                                    key={order.id}
                                    customer={getCustomerName(order.customerId)}
                                    items={order.items}
                                    total={order.total_amount}
                                    date={order.order_date}
                                    notes={noteText}
                                    type="order"
                                    getProductName={getProductName}
                                    paymentType={order.paymentType}
                                    paymentTerm={order.paymentTerm}
                                    checkBank={order.checkBank}
                                    checkNumber={order.checkNumber}
                                    checkDate={order.checkDate}
                                />
                            );
                        })
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Bugün sipariş kaydı bulunmuyor.
                        </p>
                    )}
                </DetailAccordion>

                {/* Sevkiyatlar Detayı */}
                <DetailAccordion
                    title="Oluşturulan Sevkiyatlar"
                    icon={TruckIcon}
                    count={todayData.shipments.length}
                    isOpen={openAccordion === 'shipments'}
                    onToggle={() => toggleAccordion('shipments')}
                >
                    {todayData.shipments.length > 0 ? (
                        todayData.shipments.map((shipment) => {
                            // Sevkiyatın sipariş bilgisini bul
                            const relatedOrder = orders.find(o => o.id === shipment.orderId);
                            const customerName = relatedOrder ? getCustomerName(relatedOrder.customerId) : `Sipariş ID: ${shipment.orderId}`;

                            return (
                                <DetailListItem
                                    key={shipment.id}
                                    customer={customerName}
                                    date={shipment.shipment_date}
                                    notes={`Durum: ${shipment.status} ${shipment.delivery_date ? `| Teslimat: ${formatDate(shipment.delivery_date)}` : ''}`}
                                    type="shipment"
                                    getProductName={getProductName}
                                />
                            );
                        })
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Bugün sevkiyat kaydı bulunmuyor.
                        </p>
                    )}
                </DetailAccordion>

                {/* Tahsilat Detayı */}
                <DetailAccordion
                    title="Tahsil Edilen Ödemeler"
                    icon={CurrencyDollarIcon}
                    count={todayData.payments?.length || 0}
                    isOpen={openAccordion === 'payments'}
                    onToggle={() => toggleAccordion('payments')}
                >
                    {todayData.payments && todayData.payments.length > 0 ? (
                        todayData.payments.map((payment) => {
                            const customerName = getCustomerName(payment.customerId);
                            const amount = payment.amount || 0;
                            const currency = payment.currency || 'TRY';
                            const inTRY = currency === 'USD' ? amount * 35 :
                                        currency === 'EUR' ? amount * 38 :
                                        amount;

                            return (
                                <DetailListItem
                                    key={payment.id}
                                    customer={customerName}
                                    total={inTRY}
                                    date={payment.paidDate}
                                    notes={`Ödeme Yöntemi: ${payment.paymentMethod || 'Belirtilmemiş'} | ${currency !== 'TRY' ? `${formatCurrency(amount)} ${currency} ≈ ` : ''}${formatCurrency(inTRY)}`}
                                    type="payment"
                                    getProductName={getProductName}
                                />
                            );
                        })
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Bugün tahsilat kaydı bulunmuyor.
                        </p>
                    )}
                </DetailAccordion>
            </div>

            {/* Performans Özeti */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5" />
                    Günlük Performans Özeti
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <div className="text-sm opacity-90 mb-1">Toplam Gelir Potansiyeli</div>
                        <div className="text-2xl font-bold">{formatCurrency(todayData.stats.newQuotesValue)}</div>
                        <div className="text-xs opacity-75 mt-1">{todayData.stats.newQuotes} teklif</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <div className="text-sm opacity-90 mb-1">Gerçekleşen Gelir</div>
                        <div className="text-2xl font-bold">{formatCurrency(todayData.stats.allOrdersValue)}</div>
                        <div className="text-xs opacity-75 mt-1">{todayData.stats.allOrders} sipariş</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <div className="text-sm opacity-90 mb-1">Başarı Oranı</div>
                        <div className="text-2xl font-bold">{conversionRate}%</div>
                        <div className="text-xs opacity-75 mt-1">
                            {todayData.stats.convertedOrders}/{todayData.stats.newQuotes} teklif onaylandı
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedDailyReportWithDetails;
