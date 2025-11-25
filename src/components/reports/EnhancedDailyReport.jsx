import React, { useMemo, useState, useRef, useCallback, memo } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
    CalendarIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    UsersIcon,
    DocumentTextIcon,
    ClipboardListIcon,
    TruckIcon,
    CheckCircleIcon,
    PrinterIcon,
    DownloadIcon,
    CurrencyDollarIcon
} from '../icons';
import { MetricCard } from './shared';

// Özet Satır Bileşeni
const SummaryRow = memo(({ label, value, subvalue, change, icon: Icon }) => {
    const isPositive = change >= 0;

    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                )}
                <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                {change !== undefined && change !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isPositive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                        {isPositive ? (
                            <TrendingUpIcon className="w-3 h-3" />
                        ) : (
                            <TrendingDownIcon className="w-3 h-3" />
                        )}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
                <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{value}</div>
                    {subvalue && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{subvalue}</div>
                    )}
                </div>
            </div>
        </div>
    );
});

SummaryRow.displayName = 'SummaryRow';

const EnhancedDailyReport = ({ orders, quotes, meetings, shipments, payments }) => {
    const reportRef = useRef();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateRange, setDateRange] = useState('today');

    // Veri filtreleme ve hesaplama fonksiyonu
    const getDataForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);

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
            newMeetings: meetings.filter(m => !m.isDeleted && m.date === dateStr).length,
            newQuotes: quotes.filter(q => !q.isDeleted && q.teklif_tarihi === dateStr).length,
            newQuotesValue: quotes
                .filter(q => !q.isDeleted && q.teklif_tarihi === dateStr)
                .reduce((sum, q) => sum + (q.total_amount || 0), 0),
            convertedOrders: orders
                .filter(o => !o.isDeleted && o.order_date === dateStr && o.quoteId)
                .length,
            convertedOrdersValue: orders
                .filter(o => !o.isDeleted && o.order_date === dateStr && o.quoteId)
                .reduce((sum, o) => sum + (o.total_amount || 0), 0),
            allOrders: orders.filter(o => !o.isDeleted && o.order_date === dateStr).length,
            allOrdersValue: orders
                .filter(o => !o.isDeleted && o.order_date === dateStr)
                .reduce((sum, o) => sum + (o.total_amount || 0), 0),
            newShipments: shipments.filter(s => !s.isDeleted && s.shipment_date === dateStr).length,
            completedDeliveries: shipments.filter(s => !s.isDeleted && s.delivery_date === dateStr).length,
            collectedPayments: dailyPayments.length,
            collectedPaymentsValue: dailyPaymentsValue,
        };
    };

    // Bugün ve dün verilerini hesapla
    const todayData = useMemo(() => getDataForDate(selectedDate), [
        orders, quotes, meetings, shipments, payments, selectedDate
    ]);

    const yesterdayData = useMemo(() => {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        return getDataForDate(yesterday);
    }, [orders, quotes, meetings, shipments, payments, selectedDate]);

    // Dönüşüm oranı
    const conversionRate = todayData.newQuotes > 0
        ? ((todayData.convertedOrders / todayData.newQuotes) * 100).toFixed(1)
        : 0;
    const yesterdayConversionRate = yesterdayData.newQuotes > 0
        ? ((yesterdayData.convertedOrders / yesterdayData.newQuotes) * 100).toFixed(1)
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
            case 'custom':
                // Kullanıcı date input'tan seçecek
                break;
            default:
                setSelectedDate(today.toISOString().slice(0, 10));
        }
    }, []);

    // Yazdırma fonksiyonu
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // Export fonksiyonu (basit CSV)
    const handleExport = useCallback(() => {
        const data = [
            ['Metrik', 'Değer', 'Önceki Gün', 'Değişim %'],
            ['Yeni Görüşmeler', todayData.newMeetings, yesterdayData.newMeetings,
                ((todayData.newMeetings - yesterdayData.newMeetings) / yesterdayData.newMeetings * 100).toFixed(1)],
            ['Oluşturulan Teklifler', todayData.newQuotes, yesterdayData.newQuotes,
                ((todayData.newQuotes - yesterdayData.newQuotes) / yesterdayData.newQuotes * 100).toFixed(1)],
            ['Teklif Tutarı', todayData.newQuotesValue, yesterdayData.newQuotesValue,
                ((todayData.newQuotesValue - yesterdayData.newQuotesValue) / yesterdayData.newQuotesValue * 100).toFixed(1)],
            ['Siparişe Dönen Teklif', todayData.convertedOrders, yesterdayData.convertedOrders,
                ((todayData.convertedOrders - yesterdayData.convertedOrders) / yesterdayData.convertedOrders * 100).toFixed(1)],
            ['Dönüşüm Oranı %', conversionRate, yesterdayConversionRate,
                (conversionRate - yesterdayConversionRate).toFixed(1)],
        ];

        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gunluk_rapor_${selectedDate}.csv`;
        link.click();
    }, [selectedDate, todayData, yesterdayData, conversionRate, yesterdayConversionRate]);

    return (
        <div ref={reportRef} className="space-y-6">
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

                <div className="flex flex-wrap items-center gap-3">
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
                    <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                        <button
                            onClick={handlePrint}
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Yazdır"
                        >
                            <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="CSV Olarak İndir"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Ana Metrik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Müşteri Görüşmeleri"
                    value={todayData.newMeetings}
                    previousValue={yesterdayData.newMeetings}
                    suffix=" adet"
                    icon={UsersIcon}
                    color="from-blue-500 to-blue-600"
                    details="Yeni müşteri toplantıları"
                />

                <MetricCard
                    title="Oluşturulan Teklifler"
                    value={todayData.newQuotes}
                    previousValue={yesterdayData.newQuotes}
                    suffix=" adet"
                    icon={DocumentTextIcon}
                    color="from-purple-500 to-purple-600"
                    details={formatCurrency(todayData.newQuotesValue)}
                />

                <MetricCard
                    title="Onaylanan Siparişler"
                    value={todayData.convertedOrders}
                    previousValue={yesterdayData.convertedOrders}
                    suffix=" adet"
                    icon={ClipboardListIcon}
                    color="from-green-500 to-green-600"
                    details={formatCurrency(todayData.convertedOrdersValue)}
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

            {/* Detaylı Bölümler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Satış Fırsatları */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                        Satış Fırsatları
                    </h4>
                    <div className="space-y-2">
                        <SummaryRow
                            label="Yeni Görüşmeler"
                            value={`${todayData.newMeetings} adet`}
                            change={yesterdayData.newMeetings ?
                                ((todayData.newMeetings - yesterdayData.newMeetings) / yesterdayData.newMeetings * 100).toFixed(1) : null}
                            icon={UsersIcon}
                        />
                        <SummaryRow
                            label="Verilen Teklifler"
                            value={`${todayData.newQuotes} adet`}
                            subvalue={formatCurrency(todayData.newQuotesValue)}
                            change={yesterdayData.newQuotes ?
                                ((todayData.newQuotes - yesterdayData.newQuotes) / yesterdayData.newQuotes * 100).toFixed(1) : null}
                            icon={DocumentTextIcon}
                        />
                        <SummaryRow
                            label="Ortalama Teklif Değeri"
                            value={todayData.newQuotes > 0 ? formatCurrency(todayData.newQuotesValue / todayData.newQuotes) : formatCurrency(0)}
                            icon={null}
                        />
                    </div>
                </div>

                {/* Satış Performansı */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <ClipboardListIcon className="w-5 h-5 text-green-500" />
                        Satış Performansı
                    </h4>
                    <div className="space-y-2">
                        <SummaryRow
                            label="Tekliften Sipariş"
                            value={`${todayData.convertedOrders} adet`}
                            subvalue={formatCurrency(todayData.convertedOrdersValue)}
                            change={yesterdayData.convertedOrders ?
                                ((todayData.convertedOrders - yesterdayData.convertedOrders) / yesterdayData.convertedOrders * 100).toFixed(1) : null}
                            icon={CheckCircleIcon}
                        />
                        <SummaryRow
                            label="Toplam Siparişler"
                            value={`${todayData.allOrders} adet`}
                            subvalue={formatCurrency(todayData.allOrdersValue)}
                            change={yesterdayData.allOrders ?
                                ((todayData.allOrders - yesterdayData.allOrders) / yesterdayData.allOrders * 100).toFixed(1) : null}
                            icon={ClipboardListIcon}
                        />
                        <SummaryRow
                            label="Ortalama Sipariş Değeri"
                            value={todayData.allOrders > 0 ? formatCurrency(todayData.allOrdersValue / todayData.allOrders) : formatCurrency(0)}
                            icon={null}
                        />
                    </div>
                </div>

                {/* Operasyon */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <TruckIcon className="w-5 h-5 text-amber-500" />
                        Operasyon
                    </h4>
                    <div className="space-y-2">
                        <SummaryRow
                            label="Oluşturulan Sevkiyat"
                            value={`${todayData.newShipments} adet`}
                            change={yesterdayData.newShipments ?
                                ((todayData.newShipments - yesterdayData.newShipments) / yesterdayData.newShipments * 100).toFixed(1) : null}
                            icon={TruckIcon}
                        />
                        <SummaryRow
                            label="Tamamlanan Teslimat"
                            value={`${todayData.completedDeliveries} adet`}
                            change={yesterdayData.completedDeliveries ?
                                ((todayData.completedDeliveries - yesterdayData.completedDeliveries) / yesterdayData.completedDeliveries * 100).toFixed(1) : null}
                            icon={CheckCircleIcon}
                        />
                    </div>
                </div>

                {/* Tahsilat */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />
                        Tahsilat
                    </h4>
                    <div className="space-y-2">
                        <SummaryRow
                            label="Tahsil Edilen Ödeme"
                            value={`${todayData.collectedPayments} adet`}
                            subvalue={formatCurrency(todayData.collectedPaymentsValue)}
                            change={yesterdayData.collectedPayments ?
                                ((todayData.collectedPayments - yesterdayData.collectedPayments) / yesterdayData.collectedPayments * 100).toFixed(1) : null}
                            icon={CurrencyDollarIcon}
                        />
                        <SummaryRow
                            label="Ortalama Tahsilat"
                            value={todayData.collectedPayments > 0 ? formatCurrency(todayData.collectedPaymentsValue / todayData.collectedPayments) : formatCurrency(0)}
                            icon={null}
                        />
                    </div>
                </div>

                {/* Performans Özeti */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5" />
                        Günlük Performans Özeti
                    </h4>
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <div className="text-sm opacity-90 mb-1">Toplam Gelir Potansiyeli</div>
                            <div className="text-2xl font-bold">{formatCurrency(todayData.newQuotesValue)}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <div className="text-sm opacity-90 mb-1">Gerçekleşen Gelir</div>
                            <div className="text-2xl font-bold">{formatCurrency(todayData.allOrdersValue)}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <div className="text-sm opacity-90 mb-1">Başarı Oranı</div>
                            <div className="text-2xl font-bold">{conversionRate}%</div>
                            <div className="text-xs opacity-75 mt-1">
                                {todayData.convertedOrders}/{todayData.newQuotes} teklif onaylandı
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedDailyReport;
