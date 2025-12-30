import React, { forwardRef } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { formatOrderNumber, formatQuoteNumber } from '../../utils/numberFormatters';
import type { Quote, Order, Customer, Product, Shipment } from '../../types';

interface DocumentPreviewProps {
  /** Document data (Quote, Order or Shipment) */
  doc: Quote | Order | Shipment | null;
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
  /** Related order for shipment (optional) */
  relatedOrder?: Order;
  /** All shipments list for calculating totals */
  allShipments?: Shipment[];
}

/**
 * DocumentPreview component - Displays a formatted preview of a quote, order or shipment document
 */
const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  (
    {
      doc,
      logo,
      themeColor,
      showProductDescriptions,
      showUnitPrices,
      showVatDetails,
      customNotes,
      customers,
      products,
      relatedOrder,
      allShipments = [],
    },
    ref
  ) => {
    // Determine document type
    const isQuote = doc && 'teklif_tarihi' in doc;
    const isShipment = doc && 'shipment_date' in doc;
    const isOrder = doc && !isQuote && !isShipment;

    // Customer lookup
    let customerId: string | undefined;
    if (isShipment) {
      customerId = relatedOrder?.customerId || (doc as any).customerId;
    } else if (doc) {
      customerId = doc.customerId;
    }
    const customer = customers.find((c) => c.id === customerId);

    if (!doc) {
      return <div ref={ref}>Belge yükleniyor...</div>;
    }

    let documentType = 'SİPARİŞ';
    let documentId = '';
    let documentDate = '';
    let validUntilOrDeliveryDate = '';
    let validUntilOrDeliveryLabel = '';

    if (isQuote) {
      documentType = 'TEKLİF';
      documentId = formatQuoteNumber(doc as Quote);
      documentDate = formatDate((doc as Quote).teklif_tarihi);
      validUntilOrDeliveryLabel = 'Geçerlilik:';
      validUntilOrDeliveryDate = formatDate((doc as Quote).gecerlilik_tarihi);
    } else if (isShipment) {
      documentType = 'SEVK İRSALİYESİ';
      // Shipment ID usually doesn't have a formatted number like quotes/orders, create a fallback or use tracking number
      documentId = (doc as Shipment).trackingNumber
        ? `TRK-${(doc as Shipment).trackingNumber}`
        : (doc as any).id?.substring(0, 8).toUpperCase();
      documentDate = formatDate((doc as Shipment).shipment_date);
      // For shipment, we might show Order ID
      if (relatedOrder) {
        validUntilOrDeliveryLabel = 'Sipariş No:';
        validUntilOrDeliveryDate = formatOrderNumber(relatedOrder);
      }
    } else {
      documentType = 'SİPARİŞ';
      documentId = formatOrderNumber(doc as Order);
      documentDate = formatDate((doc as Order).order_date);
      validUntilOrDeliveryLabel = 'Teslim Tarihi:';
      validUntilOrDeliveryDate = formatDate((doc as Order).delivery_date);
    }

    const companyInfo = {
      name: 'AKÇELİK METAL SANAYİ',
      address: 'Küçükbalıklı mh. 11 Eylül Bulvarı No:208/A Osmangazi/Bursa',
      phone: '+90 0224 256 86 56',
      email: 'satis@akcelik-grup.com',
    };

    const itemsHtml = (doc.items || []).map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      // Handle unit (some items might have unit property directly, or fall back to 'Adet')
      const unit = item.unit || 'Adet';

      // For shipments, item structure is slightly different (no unit_price usually needed for delivery note)
      const quantity = item.quantity || 0;
      const unitPrice = (item as any).unit_price || 0;
      const total = quantity * unitPrice;

      // Shipment Calculations
      let orderedQty = 0;
      let remainingQty = 0;

      if (isShipment && relatedOrder) {
        // Try to find matching item in order
        // 1. Try by orderItemIndex if available
        let orderItem;
        if ((item as any).orderItemIndex !== undefined) {
          orderItem = relatedOrder.items[(item as any).orderItemIndex];
        }
        // 2. Fallback: Try by productId (might be inaccurate if same product appears twice)
        if (!orderItem) {
          orderItem = relatedOrder.items.find((oi) => oi.productId === item.productId);
        }

        if (orderItem) {
          orderedQty = orderItem.quantity;

          // Calculate total shipped so far for this item (including this shipment)
          const totalShipped = allShipments
            .filter((s) => s.orderId === (doc as Shipment).orderId && !s.isDeleted)
            .reduce((sum, s) => {
              // Find matching item in this shipment
              const sItem = s.items.find(
                (si) =>
                  si.productId === item.productId &&
                  ((si as any).orderItemIndex !== undefined
                    ? (si as any).orderItemIndex === (item as any).orderItemIndex
                    : true)
              );
              return sum + (sItem?.quantity || 0);
            }, 0);

          remainingQty = Math.max(0, orderedQty - totalShipped);
        }
      }

      return (
        <tr key={index} className="border-b border-gray-200">
          <td className="py-1 px-2 text-center text-gray-500 text-xs">{index + 1}</td>
          <td className="py-1 px-2 text-sm text-gray-900">
            {product?.name ||
              (item as any).productName ||
              (item as any).product_name ||
              'Bilinmeyen Ürün'}
            {showProductDescriptions && (
              <p className="text-xs text-gray-500">{product?.description || ''}</p>
            )}
          </td>

          {/* Shipment Specific Columns */}
          {isShipment ? (
            <>
              <td className="py-1 px-2 text-center text-sm text-gray-500">
                {orderedQty > 0 ? `${orderedQty} ${unit}` : '-'}
              </td>
              <td className="py-1 px-2 text-center text-sm font-bold text-gray-900 bg-gray-50">
                {quantity} {unit}
              </td>
              <td className="py-1 px-2 text-center text-sm text-gray-500">
                {remainingQty} {unit}
              </td>
            </>
          ) : (
            // Standard Columns
            <td className="py-1 px-2 text-center text-sm text-gray-700">
              {quantity} {unit}
            </td>
          )}

          {!isShipment && showUnitPrices && (
            <td className="py-1 px-2 text-right text-sm text-gray-700">
              {formatCurrency(unitPrice, (doc as any).currency || 'TRY')}
            </td>
          )}

          {!isShipment && (
            <td className="py-1 px-2 text-right text-sm font-semibold text-gray-900">
              {formatCurrency(total, (doc as any).currency || 'TRY')}
            </td>
          )}
        </tr>
      );
    });

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black h-full flex flex-col">
        <style>{`
                    .header-bg { background-color: ${themeColor}; }
                    .header-text { color: white; }
                    .section-title { color: ${themeColor}; }
                    @media print {
                        .page-break { page-break-before: always; }
                    }
                `}</style>

        {/* Header */}
        <header
          className="flex justify-between items-start pb-6 border-b-2 mb-6"
          style={{ borderColor: themeColor }}
        >
          <div className="w-1/2">
            {logo ? (
              <img src={logo} alt="Logo" className="h-20 mb-4 object-contain" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{companyInfo.name}</h1>
            )}

            {/* Fallback Title if logo is present but hidden (handled by alt above if needed, but simplified logic here) */}
            <h1 className={`text-2xl font-bold text-gray-900 mb-2 ${logo ? 'hidden' : ''}`}>
              {companyInfo.name}
            </h1>

            <div className="text-xs text-gray-600 leading-relaxed">
              <p>{companyInfo.address}</p>
              <p>
                {companyInfo.phone} | {companyInfo.email}
              </p>
            </div>
          </div>
          <div className="text-right w-1/2">
            <h2 className="text-4xl font-bold mb-4" style={{ color: themeColor }}>
              {documentType}
            </h2>
            <div className="text-sm text-gray-600 space-y-1.5">
              <div className="flex justify-end gap-2">
                <span className="font-bold text-gray-800">Belge No:</span>
                <span>#{documentId}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="font-bold text-gray-800">Tarih:</span>
                <span>{documentDate}</span>
              </div>
              {validUntilOrDeliveryLabel && (
                <div className="flex justify-end gap-2">
                  <span className="font-bold text-gray-800">{validUntilOrDeliveryLabel}</span>
                  <span>{validUntilOrDeliveryDate}</span>
                </div>
              )}
              {isShipment && (doc as Shipment).carrier && (
                <div className="flex justify-end gap-2">
                  <span className="font-bold text-gray-800">Nakliye:</span>
                  <span>{(doc as Shipment).carrier}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Customer Info */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Sayın
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-full">
                <p className="font-bold text-gray-900 text-lg mb-2">
                  {customer?.name || 'Müşteri Bilgisi Bulunamadı'}
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-line mb-2">
                  {customer?.address}
                </p>
                <p className="text-sm text-gray-600">
                  {customer?.city && `${customer.city}`}
                  {customer?.country && `, ${customer.country}`}
                </p>
                {(customer?.taxOffice || customer?.taxNumber) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    {customer?.taxOffice && <span>VD: {customer.taxOffice}</span>}
                    {customer?.taxOffice && customer?.taxNumber && <span className="mx-2">|</span>}
                    {customer?.taxNumber && <span>VN: {customer.taxNumber}</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Additional Info Area (Optional) */}
          </div>
        </section>

        {/* Items Table */}
        <section className="mb-8 flex-grow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="header-bg header-text">
                <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider rounded-tl-md">
                  #
                </th>
                <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wider w-1/2">
                  Ürün / Hizmet
                </th>
                {isShipment ? (
                  <>
                    <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider">
                      Sipariş
                    </th>
                    <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider bg-white/10">
                      Sevk
                    </th>
                    <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider">
                      Kalan
                    </th>
                  </>
                ) : (
                  <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider">
                    Miktar
                  </th>
                )}
                {!isShipment && showUnitPrices && (
                  <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                )}
                {!isShipment && (
                  <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider rounded-tr-md">
                    Toplam
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border border-gray-200 border-t-0">
              {itemsHtml}
            </tbody>
          </table>
        </section>

        {/* Footer Section */}
        <div className="mt-auto">
          {/* Financials (Hidden for Shipments) */}
          {!isShipment && (
            <section className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Ara Toplam</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency((doc as any).subtotal || 0, (doc as any).currency || 'TRY')}
                  </span>
                </div>
                {showVatDetails && (
                  <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-600">KDV (%{(doc as any).vatRate || 20})</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency((doc as any).vatAmount || 0, (doc as any).currency || 'TRY')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 px-3 header-bg header-text rounded-md shadow-sm">
                  <span className="font-bold">GENEL TOPLAM</span>
                  <span className="font-bold">
                    {formatCurrency((doc as any).total_amount || 0, (doc as any).currency || 'TRY')}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Notes */}
          {(customNotes || (doc as any).notes) && (
            <section
              className="mb-8 border p-4 rounded-lg border-l-4"
              style={{ borderColor: themeColor, borderLeftColor: themeColor }}
            >
              <h3 className="text-xs font-bold mb-2 uppercase tracking-wider section-title">
                Notlar
              </h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap space-y-2">
                {(doc as any).notes && <p>{(doc as any).notes}</p>}
                {customNotes && <p>{customNotes}</p>}
              </div>
            </section>
          )}

          {/* Signature Section for Shipments */}
          {isShipment && (
            <section className="grid grid-cols-2 gap-12 mt-12 border-t pt-8 border-gray-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-16">TESLİM EDEN</h4>
                <div className="border-t border-gray-300 mx-8 pt-2">
                  <p className="text-xs text-gray-500">İmza / Kaşe</p>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-16">TESLİM ALAN</h4>
                <div className="border-t border-gray-300 mx-8 pt-2">
                  <p className="text-xs text-gray-500">İmza / Kaşe</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Malzemeleri eksiksiz ve hasarsız teslim aldım.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Simple Signature for Others */}
          {!isShipment && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  <p>Bu belge elektronik ortamda oluşturulmuştur.</p>
                  <p>Yazdırılma Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-center px-8">
                  <h4 className="font-bold text-gray-900 mb-12">ONAYLAYAN</h4>
                  <div className="border-t border-gray-300 pt-2 w-32 mx-auto"></div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';

export default DocumentPreview;
