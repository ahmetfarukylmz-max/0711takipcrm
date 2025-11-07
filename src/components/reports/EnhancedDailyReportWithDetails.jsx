import React, { useMemo, useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    CalendarIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    UsersIcon,
    DocumentTextIcon,
    ClipboardListIcon,
    TruckIcon,
    CheckCircleIcon,
    DownloadIcon,
    ChevronDownIcon,
    BoxIcon
} from '../icons';

// Metrik Kartı Bileşeni
const MetricCard = ({ title, value, previousValue, prefix = '', suffix = '', icon: Icon, color, details, onClick }) => {
    const change = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : 0;
    const isPositive = change >= 0;

    return (
        <div
            className={`relative overflow-hidden bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 opacity-10">
                <Icon className="w-32 h-32 -mr-8 -mt-8" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {previousValue !== undefined && (
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                            {isPositive ? (
                                <TrendingUpIcon className="w-4 h-4 text-white" />
                            ) : (
                                <TrendingDownIcon className="w-4 h-4 text-white" />
                            )}
                            <span className="text-xs font-semibold text-white">
                                {Math.abs(change)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold">
                            {prefix}{value}{suffix}
                        </h3>
                    </div>

                    {details && (
                        <p className="text-xs opacity-75 mt-2">{details}</p>
                    )}
                </div>
            </div>

            {/* Hover Details */}
            {previousValue !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs text-white/90">
                        Dün: {prefix}{previousValue}{suffix}
                    </p>
                </div>
            )}

            {onClick && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronDownIcon className="w-5 h-5 text-white rotate-[-90deg]" />
                </div>
            )}
        </div>
    );
};

// Accordion Bileşeni
const DetailAccordion = ({ title, icon: Icon, count, isOpen, onToggle, children }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 page-break-avoid">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors no-print"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{count} kayıt</p>
                    </div>
                </div>
                <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Print başlığı (sadece yazdırma sırasında) */}
            <div className="hidden print:block p-5 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">{title} ({count})</h3>
                </div>
            </div>

            {/* İçerik - Ekranda accordion, yazdırmada her zaman görünür */}
            <div className={`${isOpen ? 'block' : 'hidden'} print:block p-5 pt-0 space-y-3 print:max-h-none ${isOpen ? 'max-h-96 overflow-y-auto' : ''}`}>
                {children}
            </div>
        </div>
    );
};

// Detaylı Liste Öğesi
const DetailListItem = ({ customer, items, total, date, notes, type, getProductName }) => {
    const [showItems, setShowItems] = useState(false);

    return (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{customer}</h4>
                    {date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
                    )}
                    {notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notes}</p>
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

const EnhancedDailyReportWithDetails = ({ orders, quotes, meetings, shipments, customers, products }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateRange, setDateRange] = useState('today');
    const [openAccordion, setOpenAccordion] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Yardımcı fonksiyon: Müşteri adını ID'den bul
    const getCustomerName = (customerId) => {
        const customer = customers?.find(c => c.id === customerId);
        return customer?.name || `Müşteri ID: ${customerId}`;
    };

    // Yardımcı fonksiyon: Ürün adını ID'den bul
    const getProductName = (productId) => {
        const product = products?.find(p => p.id === productId && !p.isDeleted);
        return product?.name || 'Bilinmeyen Ürün';
    };

    // Veri filtreleme ve hesaplama fonksiyonu
    const getDetailedDataForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);

        const dayMeetings = meetings.filter(m => !m.isDeleted && m.date === dateStr);
        const dayQuotes = quotes.filter(q => !q.isDeleted && q.teklif_tarihi === dateStr);
        const dayOrders = orders.filter(o => !o.isDeleted && o.order_date === dateStr);
        const convertedOrders = dayOrders.filter(o => o.quoteId);
        const dayShipments = shipments.filter(s => !s.isDeleted && s.shipment_date === dateStr);
        const dayDeliveries = shipments.filter(s => !s.isDeleted && s.delivery_date === dateStr);

        return {
            meetings: dayMeetings,
            quotes: dayQuotes,
            allOrders: dayOrders,
            convertedOrders: convertedOrders,
            shipments: dayShipments,
            deliveries: dayDeliveries,
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
            }
        };
    };

    // Bugün ve dün verilerini hesapla
    const todayData = useMemo(() => getDetailedDataForDate(selectedDate), [
        orders, quotes, meetings, shipments, selectedDate
    ]);

    const yesterdayData = useMemo(() => {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        return getDetailedDataForDate(yesterday);
    }, [orders, quotes, meetings, shipments, selectedDate]);

    // Dönüşüm oranı
    const conversionRate = todayData.stats.newQuotes > 0
        ? ((todayData.stats.convertedOrders / todayData.stats.newQuotes) * 100).toFixed(1)
        : 0;
    const yesterdayConversionRate = yesterdayData.stats.newQuotes > 0
        ? ((yesterdayData.stats.convertedOrders / yesterdayData.stats.newQuotes) * 100).toFixed(1)
        : 0;

    // Tarih değiştirme
    const handleDateRangeChange = (range) => {
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
    };

    // Modern PDF Export fonksiyonu - AutoTable ile
    const handleExportPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                compress: true
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = margin;
            let pageNumber = 1;

            const checkPageBreak = (requiredSpace) => {
                if (yPosition + requiredSpace > pageHeight - margin) {
                    pdf.addPage();
                    pageNumber++;
                    yPosition = margin;
                    // Yeni sayfada sayfa numarasını ekle
                    pdf.setFontSize(8);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(`Sayfa ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                }
            };

            // ============================================
            // HEADER - Modern Gradient Header
            // ============================================
            const headerHeight = 40;
            pdf.setFillColor(37, 99, 235);
            pdf.rect(0, 0, pageWidth, headerHeight, 'F');

            // Sol taraf
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('AKCELIK METAL SANAYI', 15, 15);

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Organize Sanayi Bolgesi, Bursa | Tel: 0224 123 45 67', 15, 23);

            // Sağ taraf
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('GUNLUK PERFORMANS RAPORU', pageWidth - 15, 15, { align: 'right' });

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(formatDate(selectedDate), pageWidth - 15, 23, { align: 'right' });

            // İlk sayfa numarası
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Sayfa 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            yPosition = headerHeight + 15;

            // Özet Metrikler - AutoTable ile
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 64, 175); // blue-800
            pdf.text('PERFORMANS METRIKLERI', margin, yPosition);
            yPosition += 3;

            const metricsBody = [
                [
                    { content: `Müşteri Görüşmeleri\n${todayData.stats.newMeetings} adet`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12 } },
                    { content: `Oluşturulan Teklifler\n${todayData.stats.newQuotes} adet\n${formatCurrency(todayData.stats.newQuotesValue)}`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12 } },
                ],
                [
                    { content: `Onaylanan Siparişler\n${todayData.stats.convertedOrders} adet\n${formatCurrency(todayData.stats.convertedOrdersValue)}`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12 } },
                    { content: `Dönüşüm Oranı\n${conversionRate}%`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12 } },
                ]
            ];

            autoTable(pdf, {
                startY: yPosition,
                body: metricsBody,
                theme: 'grid',
                styles: {
                    cellPadding: 8,
                    lineWidth: 0.1,
                    lineColor: [203, 213, 225],
                },
                didDrawCell: (data) => {
                    if (data.section === 'body') {
                        pdf.setDrawColor(203, 213, 225);
                        pdf.setLineWidth(0.1);
                        pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
                    }
                },
                margin: { left: margin, right: margin },
            });

            yPosition = pdf.lastAutoTable.finalY + 15;

            // Müşteri Görüşmeleri Detayı - AutoTable ile
            if (todayData.meetings && todayData.meetings.length > 0) {
                checkPageBreak(50);

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 64, 175);
                pdf.text(`MÜŞTERİ GÖRÜŞMELERİ (${todayData.meetings.length})`, margin, yPosition);
                yPosition += 10;

                const meetingsBody = todayData.meetings.map(meeting => ([
                    getCustomerName(meeting.customerId),
                    formatDate(meeting.date),
                    meeting.notes || meeting.outcome || '-'
                ]));

                autoTable(pdf, {
                    startY: yPosition,
                    head: [['Müşteri Adı', 'Tarih', 'Notlar / Sonuç']],
                    body: meetingsBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: 255,
                        fontStyle: 'bold',
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 9,
                    },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: 'auto' },
                    },
                    margin: { left: margin, right: margin },
                });

                yPosition = pdf.lastAutoTable.finalY + 15;
            }

            // Oluşturulan Teklifler Detayı - AutoTable ile
            if (todayData.quotes && todayData.quotes.length > 0) {
                checkPageBreak(50);

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 64, 175);
                pdf.text(`OLUŞTURULAN TEKLİFLER (${todayData.quotes.length})`, margin, yPosition);
                yPosition += 10;

                const quotesBody = todayData.quotes.map(quote => ([
                    `#${quote.id.substring(0, 5)}`,
                    getCustomerName(quote.customerId),
                    formatDate(quote.teklif_tarihi),
                    quote.status || 'Bekliyor',
                    formatCurrency(quote.total_amount)
                ]));

                autoTable(pdf, {
                    startY: yPosition,
                    head: [['#', 'Müşteri', 'Tarih', 'Durum', 'Tutar']],
                    body: quotesBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [168, 85, 247],
                        textColor: 255,
                        fontStyle: 'bold',
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 9,
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 50 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 30 },
                        4: { cellWidth: 'auto', halign: 'right' },
                    },
                    margin: { left: margin, right: margin },
                });

                yPosition = pdf.lastAutoTable.finalY + 15;
            }

            // Onaylanan Siparişler Detayı - AutoTable ile
            if (todayData.allOrders && todayData.allOrders.length > 0) {
                checkPageBreak(50);

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 64, 175);
                pdf.text(`ONAYLANAN SİPARİŞLER (${todayData.allOrders.length})`, margin, yPosition);
                yPosition += 10;

                const ordersBody = todayData.allOrders.map(order => ([
                    `#${order.id.substring(0, 5)}`,
                    getCustomerName(order.customerId),
                    formatDate(order.order_date),
                    order.quoteId ? '✓ Tekliften' : (order.status || 'Bekliyor'),
                    formatCurrency(order.total_amount)
                ]));

                autoTable(pdf, {
                    startY: yPosition,
                    head: [['#', 'Müşteri', 'Tarih', 'Durum', 'Tutar']],
                    body: ordersBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [34, 197, 94],
                        textColor: 255,
                        fontStyle: 'bold',
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 9,
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 50 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 30 },
                        4: { cellWidth: 'auto', halign: 'right' },
                    },
                    margin: { left: margin, right: margin },
                });

                yPosition = pdf.lastAutoTable.finalY + 15;
            }

            // Sevkiyatlar - AutoTable ile
            if (todayData.shipments && todayData.shipments.length > 0) {
                checkPageBreak(50);

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 64, 175);
                pdf.text(`OLUŞTURULAN SEVKİYATLAR (${todayData.shipments.length})`, margin, yPosition);
                yPosition += 10;

                const shipmentsBody = todayData.shipments.map(shipment => {
                    const relatedOrder = orders.find(o => o.id === shipment.orderId);
                    const customerName = relatedOrder ? getCustomerName(relatedOrder.customerId) : 'Bilinmiyor';
                    return [
                        customerName,
                        formatDate(shipment.shipment_date),
                        shipment.status,
                        shipment.delivery_date ? formatDate(shipment.delivery_date) : '-'
                    ];
                });

                autoTable(pdf, {
                    startY: yPosition,
                    head: [['Müşteri', 'Sevkiyat Tarihi', 'Durum', 'Teslimat']],
                    body: shipmentsBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [251, 146, 60],
                        textColor: 255,
                        fontStyle: 'bold',
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 9,
                    },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 35 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 'auto' },
                    },
                    margin: { left: margin, right: margin },
                });

                yPosition = pdf.lastAutoTable.finalY + 15;
            }

            // Modern Footer - AutoTable ile
            checkPageBreak(55);

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 64, 175);
            pdf.text('GÜNLÜK PERFORMANS ÖZETİ', margin, yPosition);
            yPosition += 10;

            const summaryBody = [
                [
                    { content: `Gelir Potansiyeli\n${formatCurrency(todayData.stats.newQuotesValue)}\n${todayData.stats.newQuotes} Teklif`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, fillColor: [239, 246, 255] } },
                    { content: `Gerçekleşen Gelir\n${formatCurrency(todayData.stats.allOrdersValue)}\n${todayData.stats.allOrders} Sipariş`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, fillColor: [239, 246, 255] } },
                    { content: `Başarı Oranı\n${conversionRate}%\n${todayData.stats.convertedOrders}/${todayData.stats.newQuotes} Onaylandı`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, fillColor: [239, 246, 255] } },
                ]
            ];

            autoTable(pdf, {
                startY: yPosition,
                body: summaryBody,
                theme: 'grid',
                styles: {
                    cellPadding: 8,
                    lineWidth: 0.1,
                    lineColor: [203, 213, 225],
                },
                didDrawCell: (data) => {
                    if (data.section === 'body') {
                        pdf.setDrawColor(203, 213, 225);
                        pdf.setLineWidth(0.1);
                        pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
                    }
                },
                margin: { left: margin, right: margin },
            });

            yPosition = pdf.lastAutoTable.finalY + 15;



            pdf.save(`gunluk_performans_raporu_${selectedDate}.pdf`);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            alert('PDF oluştururken bir hata oluştu! Lütfen tekrar deneyin.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // CSV Export fonksiyonu
    const handleExportCsv = () => {
        const data = [
            ['Günlük Performans Raporu', selectedDate],
            [''],
            ['Metrik', 'Değer', 'Önceki Gün', 'Değişim %'],
            ['Yeni Görüşmeler', todayData.stats.newMeetings, yesterdayData.stats.newMeetings, ''],
            ['Oluşturulan Teklifler', todayData.stats.newQuotes, yesterdayData.stats.newQuotes, ''],
            ['Teklif Tutarı', todayData.stats.newQuotesValue, yesterdayData.stats.newQuotesValue, ''],
            ['Siparişe Dönen Teklif', todayData.stats.convertedOrders, yesterdayData.stats.convertedOrders, ''],
            ['Dönüşüm Oranı %', conversionRate, yesterdayConversionRate, ''],
        ];

        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gunluk_rapor_${selectedDate}.csv`;
        link.click();
    };

    const toggleAccordion = (key) => {
        setOpenAccordion(openAccordion === key ? null : key);
    };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    value={todayData.stats.convertedOrders}
                    previousValue={yesterdayData.stats.convertedOrders}
                    suffix=" adet"
                    icon={ClipboardListIcon}
                    color="from-green-500 to-green-600"
                    details={formatCurrency(todayData.stats.convertedOrdersValue)}
                    onClick={() => toggleAccordion('orders')}
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
                                date={meeting.date}
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
                                notes={`Durum: ${quote.status || 'Bekliyor'}`}
                                type="quote"
                                getProductName={getProductName}
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
                        todayData.allOrders.map((order) => (
                            <DetailListItem
                                key={order.id}
                                customer={getCustomerName(order.customerId)}
                                items={order.items}
                                total={order.total_amount}
                                date={order.order_date}
                                notes={order.quoteId ? '✓ Tekliften dönüştürüldü' : `Durum: ${order.status || 'Bekliyor'}`}
                                type="order"
                                getProductName={getProductName}
                            />
                        ))
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
