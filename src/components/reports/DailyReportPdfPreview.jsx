import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';

const DailyReportPdfPreview = React.forwardRef(({
    selectedDate,
    todayData,
    yesterdayData,
    conversionRate,
    yesterdayConversionRate,
    getCustomerName,
    getProductName,
    logo,
    themeColor = '#3b82f6'
}, ref) => {
    const companyInfo = {
        name: "AKÇELİK METAL SANAYİ",
        address: "Küçükbalıklı mh. 11 Eylül Bulvarı No:208/A Osmangazi/Bursa",
        phone: "+90 0224 256 86 56",
        email: "satis@akcelik-grup.com",
    };

    const formatChange = (current, previous) => {
        if (!previous || previous === 0) return '-';
        const change = ((current - previous) / previous * 100).toFixed(1);
        const isPositive = change >= 0;
        return `${isPositive ? '+' : ''}${change}%`;
    };

    const getTrendSymbol = (current, previous) => {
        if (!previous || previous === 0) return '';
        return current >= previous ? '↑' : '↓';
    };

    return (
        <div ref={ref} className="p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#ffffff', color: '#000000', minHeight: '100vh' }}>
            <style>{`
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
                @page {
                    margin: 0;
                    size: A4;
                }
                .page-break-avoid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .header-bg {
                    background: linear-gradient(135deg, ${themeColor} 0%, #1e40af 100%);
                }
                .header-text { color: white; }
                .section-title {
                    color: ${themeColor};
                    border-bottom: 3px solid ${themeColor};
                    position: relative;
                    padding-left: 12px;
                }
                .section-title::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: ${themeColor};
                    border-radius: 2px;
                }
                .metric-card {
                    border-left: 5px solid ${themeColor};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                }
                .trend-up { color: #059669; }
                .trend-down { color: #dc2626; }
                .badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .badge-success { background: #d1fae5; color: #065f46; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-info { background: #dbeafe; color: #1e40af; }
            `}</style>

            {/* Modern Header with Gradient */}
            <header className="mb-8" style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, #1e40af 100%)`,
                padding: '32px',
                borderRadius: '12px',
                color: '#ffffff'
            }}>
                <div className="flex justify-between items-start">
                    <div>
                        {logo ? (
                            <img src={logo} alt="Logo" className="h-24 mb-3" style={{ filter: 'brightness(0) invert(1)' }}/>
                        ) : (
                            <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>{companyInfo.name}</h1>
                        )}
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>{companyInfo.address}</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{companyInfo.phone} | {companyInfo.email}</p>
                    </div>
                    <div className="text-right">
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '16px 24px',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <h2 className="text-2xl font-bold mb-3" style={{ color: '#ffffff', letterSpacing: '1px' }}>
                                GÜNLÜK PERFORMANS RAPORU
                            </h2>
                            <div className="text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                                <p><span className="font-semibold">📅 Rapor Tarihi:</span> {formatDate(selectedDate)}</p>
                                <p><span className="font-semibold">🕐 Oluşturulma:</span> {formatDate(new Date().toISOString().slice(0, 10))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Summary Metrics */}
            <section className="mb-8 page-break-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="section-title text-xl font-bold pb-3 mb-6">📊 ÖZET METRİKLER</h3>
                <div className="grid grid-cols-2 gap-5">
                    {/* Meeting Card */}
                    <div className="metric-card p-5 rounded" style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '2px solid #bfdbfe',
                        borderRadius: '12px'
                    }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    background: '#3b82f6',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>🤝</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Müşteri Görüşmeleri</p>
                                <p className="text-4xl font-bold mt-2" style={{ color: '#1e3a8a' }}>
                                    {todayData.stats.newMeetings}
                                </p>
                            </div>
                            <div className="text-right">
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: todayData.stats.newMeetings >= yesterdayData.stats.newMeetings ? '#d1fae5' : '#fee2e2',
                                    marginBottom: '4px'
                                }}>
                                    <span className="text-sm font-bold" style={{
                                        color: todayData.stats.newMeetings >= yesterdayData.stats.newMeetings ? '#059669' : '#dc2626'
                                    }}>
                                        {getTrendSymbol(todayData.stats.newMeetings, yesterdayData.stats.newMeetings)} {formatChange(todayData.stats.newMeetings, yesterdayData.stats.newMeetings)}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: '#64748b' }}>Önceki: {yesterdayData.stats.newMeetings}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quotes Card */}
                    <div className="metric-card p-5 rounded" style={{
                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                        border: '2px solid #e9d5ff',
                        borderRadius: '12px'
                    }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    background: '#9333ea',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>📄</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Oluşturulan Teklifler</p>
                                <p className="text-4xl font-bold mt-2" style={{ color: '#581c87' }}>
                                    {todayData.stats.newQuotes}
                                </p>
                                <p className="text-sm font-semibold mt-1" style={{ color: '#7e22ce' }}>{formatCurrency(todayData.stats.newQuotesValue)}</p>
                            </div>
                            <div className="text-right">
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: todayData.stats.newQuotes >= yesterdayData.stats.newQuotes ? '#d1fae5' : '#fee2e2',
                                    marginBottom: '4px'
                                }}>
                                    <span className="text-sm font-bold" style={{
                                        color: todayData.stats.newQuotes >= yesterdayData.stats.newQuotes ? '#059669' : '#dc2626'
                                    }}>
                                        {getTrendSymbol(todayData.stats.newQuotes, yesterdayData.stats.newQuotes)} {formatChange(todayData.stats.newQuotes, yesterdayData.stats.newQuotes)}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: '#64748b' }}>Önceki: {yesterdayData.stats.newQuotes}</p>
                            </div>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className="metric-card p-5 rounded" style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '2px solid #bbf7d0',
                        borderRadius: '12px'
                    }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    background: '#16a34a',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>✅</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Onaylanan Siparişler</p>
                                <p className="text-4xl font-bold mt-2" style={{ color: '#14532d' }}>
                                    {todayData.stats.convertedOrders}
                                </p>
                                <p className="text-sm font-semibold mt-1" style={{ color: '#15803d' }}>{formatCurrency(todayData.stats.convertedOrdersValue)}</p>
                            </div>
                            <div className="text-right">
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: todayData.stats.convertedOrders >= yesterdayData.stats.convertedOrders ? '#d1fae5' : '#fee2e2',
                                    marginBottom: '4px'
                                }}>
                                    <span className="text-sm font-bold" style={{
                                        color: todayData.stats.convertedOrders >= yesterdayData.stats.convertedOrders ? '#059669' : '#dc2626'
                                    }}>
                                        {getTrendSymbol(todayData.stats.convertedOrders, yesterdayData.stats.convertedOrders)} {formatChange(todayData.stats.convertedOrders, yesterdayData.stats.convertedOrders)}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: '#64748b' }}>Önceki: {yesterdayData.stats.convertedOrders}</p>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="metric-card p-5 rounded" style={{
                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                        border: '2px solid #fed7aa',
                        borderRadius: '12px'
                    }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    background: '#ea580c',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>🎯</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dönüşüm Oranı</p>
                                <p className="text-4xl font-bold mt-2" style={{ color: '#7c2d12' }}>
                                    {conversionRate}%
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#c2410c' }}>Teklif → Sipariş</p>
                            </div>
                            <div className="text-right">
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: parseFloat(conversionRate) >= parseFloat(yesterdayConversionRate) ? '#d1fae5' : '#fee2e2',
                                    marginBottom: '4px'
                                }}>
                                    <span className="text-sm font-bold" style={{
                                        color: parseFloat(conversionRate) >= parseFloat(yesterdayConversionRate) ? '#059669' : '#dc2626'
                                    }}>
                                        {getTrendSymbol(parseFloat(conversionRate), parseFloat(yesterdayConversionRate))} {formatChange(parseFloat(conversionRate), parseFloat(yesterdayConversionRate))}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: '#64748b' }}>Önceki: {yesterdayConversionRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meetings Detail */}
            {todayData.meetings && todayData.meetings.length > 0 && (
                <section className="mb-8 page-break-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 className="section-title text-xl font-bold pb-3 mb-6">🤝 MÜŞTERİ GÖRÜŞMELERİ ({todayData.meetings.length})</h3>
                    <div style={{
                        background: '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="header-bg header-text" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Müşteri</th>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Tarih</th>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Notlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayData.meetings.map((meeting, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: idx !== todayData.meetings.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        background: idx % 2 === 0 ? '#ffffff' : '#f9fafb'
                                    }}>
                                        <td className="py-3 px-4 font-semibold" style={{ color: '#111827' }}>{getCustomerName(meeting.customerId)}</td>
                                        <td className="py-3 px-4" style={{ color: '#374151' }}>{formatDate(meeting.date)}</td>
                                        <td className="py-3 px-4 text-xs" style={{ color: '#6b7280' }}>{meeting.notes || meeting.outcome || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Quotes Detail */}
            {todayData.quotes && todayData.quotes.length > 0 && (
                <section className="mb-8 page-break-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 className="section-title text-xl font-bold pb-3 mb-6">📄 OLUŞTURULAN TEKLİFLER ({todayData.quotes.length})</h3>
                    {todayData.quotes.map((quote, idx) => (
                        <div key={idx} className="mb-5 page-break-avoid" style={{
                            background: 'linear-gradient(to right, #faf5ff 0%, #ffffff 100%)',
                            border: '2px solid #e9d5ff',
                            borderRadius: '12px',
                            padding: '20px',
                            borderLeft: '6px solid #9333ea',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid'
                        }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                                        color: '#ffffff',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Teklif #{idx + 1}
                                    </div>
                                    <h4 className="font-bold text-lg" style={{ color: '#111827', marginBottom: '6px' }}>{getCustomerName(quote.customerId)}</h4>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <p className="text-sm" style={{ color: '#6b7280' }}>📅 {formatDate(quote.teklif_tarihi)}</p>
                                        <p className="text-sm">
                                            <span className="badge" style={{
                                                background: quote.status === 'Onaylandı' ? '#d1fae5' : '#fef3c7',
                                                color: quote.status === 'Onaylandı' ? '#065f46' : '#92400e',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {quote.status || 'Bekliyor'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold" style={{ color: '#9333ea', marginBottom: '4px' }}>Toplam Tutar</p>
                                    <p className="text-2xl font-bold" style={{ color: '#7e22ce' }}>
                                        {formatCurrency(quote.total_amount)}
                                    </p>
                                </div>
                            </div>
                            {quote.items && quote.items.length > 0 && (
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid #e9d5ff'
                                }}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr style={{ background: '#f3e8ff' }}>
                                                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#581c87' }}>Ürün</th>
                                                <th className="py-2 px-3 text-center font-semibold" style={{ color: '#581c87' }}>Miktar</th>
                                                <th className="py-2 px-3 text-right font-semibold" style={{ color: '#581c87' }}>Birim Fiyat</th>
                                                <th className="py-2 px-3 text-right font-semibold" style={{ color: '#581c87' }}>Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quote.items.map((item, itemIdx) => (
                                                <tr key={itemIdx} style={{
                                                    borderBottom: itemIdx !== quote.items.length - 1 ? '1px solid #faf5ff' : 'none',
                                                    background: itemIdx % 2 === 0 ? '#ffffff' : '#fdfcff'
                                                }}>
                                                    <td className="py-2 px-3" style={{ color: '#374151' }}>{getProductName(item.productId)}</td>
                                                    <td className="py-2 px-3 text-center" style={{ color: '#6b7280' }}>{item.quantity} {item.unit || 'Kg'}</td>
                                                    <td className="py-2 px-3 text-right" style={{ color: '#6b7280' }}>{formatCurrency(item.unit_price)}</td>
                                                    <td className="py-2 px-3 text-right font-bold" style={{ color: '#7e22ce' }}>
                                                        {formatCurrency(item.quantity * item.unit_price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* Orders Detail */}
            {todayData.allOrders && todayData.allOrders.length > 0 && (
                <section className="mb-8 page-break-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 className="section-title text-xl font-bold pb-3 mb-6">✅ ONAYLANAN SİPARİŞLER ({todayData.allOrders.length})</h3>
                    {todayData.allOrders.map((order, idx) => (
                        <div key={idx} className="mb-5 page-break-avoid" style={{
                            background: 'linear-gradient(to right, #f0fdf4 0%, #ffffff 100%)',
                            border: '2px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '20px',
                            borderLeft: '6px solid #16a34a',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid'
                        }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                        color: '#ffffff',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Sipariş #{idx + 1}
                                    </div>
                                    <h4 className="font-bold text-lg" style={{ color: '#111827', marginBottom: '6px' }}>{getCustomerName(order.customerId)}</h4>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <p className="text-sm" style={{ color: '#6b7280' }}>📅 {formatDate(order.order_date)}</p>
                                        {order.quoteId ? (
                                            <p className="text-sm">
                                                <span style={{
                                                    background: '#d1fae5',
                                                    color: '#065f46',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    ✓ Tekliften Dönüştürüldü
                                                </span>
                                            </p>
                                        ) : (
                                            <p className="text-sm">
                                                <span style={{
                                                    background: '#dbeafe',
                                                    color: '#1e40af',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    {order.status}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold" style={{ color: '#16a34a', marginBottom: '4px' }}>Toplam Tutar</p>
                                    <p className="text-2xl font-bold" style={{ color: '#15803d' }}>
                                        {formatCurrency(order.total_amount)}
                                    </p>
                                </div>
                            </div>
                            {order.items && order.items.length > 0 && (
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid #bbf7d0'
                                }}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr style={{ background: '#dcfce7' }}>
                                                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#14532d' }}>Ürün</th>
                                                <th className="py-2 px-3 text-center font-semibold" style={{ color: '#14532d' }}>Miktar</th>
                                                <th className="py-2 px-3 text-right font-semibold" style={{ color: '#14532d' }}>Birim Fiyat</th>
                                                <th className="py-2 px-3 text-right font-semibold" style={{ color: '#14532d' }}>Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, itemIdx) => (
                                                <tr key={itemIdx} style={{
                                                    borderBottom: itemIdx !== order.items.length - 1 ? '1px solid #f0fdf4' : 'none',
                                                    background: itemIdx % 2 === 0 ? '#ffffff' : '#fafffe'
                                                }}>
                                                    <td className="py-2 px-3" style={{ color: '#374151' }}>{getProductName(item.productId)}</td>
                                                    <td className="py-2 px-3 text-center" style={{ color: '#6b7280' }}>{item.quantity} {item.unit || 'Kg'}</td>
                                                    <td className="py-2 px-3 text-right" style={{ color: '#6b7280' }}>{formatCurrency(item.unit_price)}</td>
                                                    <td className="py-2 px-3 text-right font-bold" style={{ color: '#15803d' }}>
                                                        {formatCurrency(item.quantity * item.unit_price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* Shipments Detail */}
            {todayData.shipments && todayData.shipments.length > 0 && (
                <section className="mb-8 page-break-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 className="section-title text-xl font-bold pb-3 mb-6">🚚 OLUŞTURULAN SEVKİYATLAR ({todayData.shipments.length})</h3>
                    <div style={{
                        background: '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="header-bg header-text" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Müşteri</th>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Sevkiyat Tarihi</th>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Durum</th>
                                    <th className="py-3 px-4 text-left font-semibold" style={{ color: '#ffffff' }}>Teslimat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayData.shipments.map((shipment, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: idx !== todayData.shipments.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        background: idx % 2 === 0 ? '#ffffff' : '#fffbeb'
                                    }}>
                                        <td className="py-3 px-4 font-semibold" style={{ color: '#111827' }}>{getCustomerName(shipment.customerId)}</td>
                                        <td className="py-3 px-4" style={{ color: '#374151' }}>📅 {formatDate(shipment.shipment_date)}</td>
                                        <td className="py-3 px-4">
                                            <span style={{
                                                background: shipment.status === 'Teslim Edildi' ? '#d1fae5' : '#fef3c7',
                                                color: shipment.status === 'Teslim Edildi' ? '#065f46' : '#92400e',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {shipment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs" style={{ color: '#6b7280' }}>
                                            {shipment.delivery_date ? `✓ ${formatDate(shipment.delivery_date)}` : '⏳ Bekliyor'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Footer Summary */}
            <section className="mt-8 mb-8">
                <div style={{
                    background: `linear-gradient(135deg, ${themeColor} 0%, #1e40af 100%)`,
                    padding: '24px',
                    borderRadius: '12px',
                    color: '#ffffff'
                }}>
                    <h3 className="text-lg font-bold mb-6 text-center" style={{ color: '#ffffff', letterSpacing: '1px' }}>
                        📈 GÜNLÜK PERFORMANS ÖZETİ
                    </h3>
                    <div className="grid grid-cols-3 gap-5 text-center">
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '10px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                marginBottom: '8px'
                            }}>💰</div>
                            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gelir Potansiyeli</p>
                            <p className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>{formatCurrency(todayData.stats.newQuotesValue)}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{todayData.stats.newQuotes} teklif</p>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '10px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                marginBottom: '8px'
                            }}>✨</div>
                            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gerçekleşen Gelir</p>
                            <p className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>{formatCurrency(todayData.stats.allOrdersValue)}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{todayData.stats.allOrders} sipariş</p>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '10px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                marginBottom: '8px'
                            }}>🎯</div>
                            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Başarı Oranı</p>
                            <p className="text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>{conversionRate}%</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                {todayData.stats.convertedOrders}/{todayData.stats.newQuotes} teklif onaylandı
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modern Footer */}
            <footer className="mt-8 text-center" style={{
                padding: '20px',
                background: 'linear-gradient(to right, #f9fafb 0%, #ffffff 100%)',
                borderTop: '3px solid #e5e7eb',
                borderRadius: '8px'
            }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                    Bu rapor otomatik olarak oluşturulmuştur.
                </p>
                <div style={{
                    display: 'inline-block',
                    background: `linear-gradient(135deg, ${themeColor} 0%, #2563eb 100%)`,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    marginTop: '4px'
                }}>
                    <p className="text-xs font-bold" style={{ color: '#ffffff' }}>
                        {companyInfo.name}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.9)', marginTop: '2px' }}>
                        {companyInfo.phone} | {companyInfo.email}
                    </p>
                </div>
            </footer>
        </div>
    );
});

DailyReportPdfPreview.displayName = 'DailyReportPdfPreview';

export default DailyReportPdfPreview;
