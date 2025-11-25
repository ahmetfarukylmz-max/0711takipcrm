import React, { forwardRef } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { formatOrderNumber, formatQuoteNumber } from '../../utils/numberFormatters';
import type { Quote, Order, Customer, Product } from '../../types';

interface DocumentPreviewProps {
    /** Document data (Quote or Order) */
    doc: Quote | Order | null;
    /** Company logo URL */
    logo?: string;
    /** Theme color for the document */
    themeColor: string;
    /** Show product descriptions */
    showProductDescriptions: boolean;
    /** Show unit prices */
    showUnitPrices: boolean;
    /** Show VAT details */
    showVatDetails: boolean;
    /** Custom notes to display */
    customNotes?: string;
    /** List of customers for lookup */
    customers: Customer[];
    /** List of products for lookup */
    products: Product[];
}

/**
 * DocumentPreview component - Displays a formatted preview of a quote or order document
 */
const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
    ({ doc, logo, themeColor, showProductDescriptions, showUnitPrices, showVatDetails, customNotes, customers, products }, ref) => {
        const customer = customers.find(c => c.id === doc?.customerId);

        if (!doc) {
            return <div ref={ref}>Belge yükleniyor...</div>;
        }

        const isQuote = 'teklif_tarihi' in doc;
        const documentType = isQuote ? 'TEKLİF' : 'SİPARİŞ';
        const documentId = isQuote ? formatQuoteNumber(doc as Quote) : formatOrderNumber(doc as Order);

        const companyInfo = {
            name: "AKÇELİK METAL SANAYİ",
            address: "Küçükbalıklı mh. 11 Eylül Bulvarı No:208/A Osmangazi/Bursa",
            phone: "+90 0224 256 86 56",
            email: "satis@akcelik-grup.com",
        };

        const itemsHtml = (doc.items || []).map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            return (
                <tr key={index} className="border-b border-gray-200">
                    <td className="py-1 px-2 text-center text-gray-500 text-xs">{index + 1}</td>
                    <td className="py-1 px-2 text-sm text-gray-900">
                        {product?.name || item.product_name || 'Bilinmeyen Ürün'}
                        {showProductDescriptions && <p className="text-xs text-gray-500">{product?.description || ''}</p>}
                    </td>
                    <td className="py-1 px-2 text-center text-sm text-gray-700">{item.quantity || 0} Kg</td>
                    {showUnitPrices && <td className="py-1 px-2 text-right text-sm text-gray-700">{formatCurrency(item.unit_price || 0, doc.currency || 'TRY')}</td>}
                    <td className="py-1 px-2 text-right text-sm font-semibold text-gray-900">{formatCurrency((item.quantity || 0) * (item.unit_price || 0), doc.currency || 'TRY')}</td>
                </tr>
            );
        });

        return (
            <div ref={ref} className="bg-white p-4 max-w-4xl mx-auto text-black">
                <style>{`
                    .header-bg { background-color: ${themeColor}; }
                    .header-text { color: white; }
                    .section-title { color: ${themeColor}; }
                `}</style>
                <header className="flex justify-between items-start pb-4 border-b-2" style={{ borderColor: themeColor }}>
                    <div>
                        {logo ? <img src={logo} alt="Logo" className="h-16 mb-3" /> : <h1 className="text-xl font-bold text-gray-900">{companyInfo.name}</h1>}
                        <p className="text-xs text-gray-600 mt-1">{companyInfo.address}</p>
                        <p className="text-xs text-gray-600">{companyInfo.phone} | {companyInfo.email}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: themeColor }}>{documentType}</h2>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-semibold">No:</span> #{documentId}</p>
                            <p><span className="font-semibold">Tarih:</span> {formatDate(isQuote ? (doc as Quote).teklif_tarihi : (doc as Order).order_date)}</p>
                            {isQuote && <p><span className="font-semibold">Geçerlilik:</span> {formatDate((doc as Quote).gecerlilik_tarihi)}</p>}
                            {!isQuote && <p><span className="font-semibold">Teslim Tarihi:</span> {formatDate((doc as Order).delivery_date)}</p>}
                        </div>
                    </div>
                </header>

                <section className="mt-4">
                    <div className="border p-3 text-xs" style={{ borderColor: themeColor }}>
                        <p className="font-bold text-gray-900">{customer?.name}</p>
                        <p className="text-gray-600">{customer?.address || ''}, {customer?.city || ''}</p>
                        <p className="text-gray-600">Tel: {customer?.phone || ''} {customer?.email ? `| E-posta: ${customer.email}` : ''}</p>
                        {(customer?.taxOffice || customer?.taxNumber) && (
                            <p className="text-gray-600 mt-1">
                                {customer?.taxOffice ? `Vergi Dairesi: ${customer.taxOffice}` : ''}
                                {customer?.taxOffice && customer?.taxNumber ? ' | ' : ''}
                                {customer?.taxNumber ? `Vergi No: ${customer.taxNumber}` : ''}
                            </p>
                        )}
                    </div>
                </section>

                <section className="mt-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="header-bg header-text">
                                <th className="py-1 px-2 text-center text-xs font-semibold">#</th>
                                <th className="py-1 px-2 text-left text-xs font-semibold">Ürün/Hizmet</th>
                                <th className="py-1 px-2 text-center text-xs font-semibold">Miktar</th>
                                {showUnitPrices && <th className="py-1 px-2 text-right text-xs font-semibold">Birim Fiyat</th>}
                                <th className="py-1 px-2 text-right text-xs font-semibold">Toplam</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsHtml}
                        </tbody>
                    </table>
                </section>

                <section className="mt-4 flex justify-end">
                    <div className="w-80">
                        <div className="flex justify-between text-xs py-1 px-2 border-b">
                            <span className="text-gray-700">Ara Toplam:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(doc.subtotal || 0, doc.currency || 'TRY')}</span>
                        </div>
                        {showVatDetails && <div className="flex justify-between text-xs py-1 px-2 border-b">
                            <span className="text-gray-700">KDV (%{doc.vatRate || 10}):</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(doc.vatAmount || 0, doc.currency || 'TRY')}</span>
                        </div>}
                        <div className="flex justify-between py-1 px-2 header-bg header-text">
                            <span className="text-sm font-bold">GENEL TOPLAM</span>
                            <span className="text-sm font-bold">{formatCurrency(doc.total_amount || 0, doc.currency || 'TRY')}</span>
                        </div>
                    </div>
                </section>

                {customNotes && <section className="mt-4 border p-3" style={{ borderColor: themeColor }}>
                    <h3 className="text-xs font-semibold mb-2 uppercase section-title">Özel Notlar</h3>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{customNotes}</p>
                </section>}

            </div>
        );
    }
);

DocumentPreview.displayName = 'DocumentPreview';

export default DocumentPreview;
