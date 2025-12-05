import React, { useState, useRef, memo, ChangeEvent } from 'react';
import DocumentPreview from './DocumentPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Quote, Order, Customer, Product, Shipment } from '../../types';
import { COMPANY_DETAILS } from '../../constants/company';

interface PdfGeneratorProps {
  /** Document data (Quote, Order or Shipment) */
  doc: Quote | Order | Shipment;
  /** List of customers for lookup */
  customers: Customer[];
  /** List of products for lookup */
  products: Product[];
  /** List of orders (needed for shipment context) */
  orders?: Order[];
  /** List of shipments (needed for calculating remaining quantities) */
  shipments?: Shipment[];
}

/**
 * PdfGenerator component - Generates customizable PDF documents from quotes, orders or shipments
 */
const PdfGenerator = memo<PdfGeneratorProps>(
  ({ doc, customers, products, orders = [], shipments = [] }) => {
    // Try to load default logo from shared constants
    const [logo, setLogo] = useState<string | null>(COMPANY_DETAILS.logo);
    const [themeColor, setThemeColor] = useState<string>('#3b82f6');
    const [showProductDescriptions, setShowProductDescriptions] = useState<boolean>(true);
    const [showUnitPrices, setShowUnitPrices] = useState<boolean>(true);
    const [showVatDetails, setShowVatDetails] = useState<boolean>(true);
    const [customNotes, setCustomNotes] = useState<string>('');
    const previewRef = useRef<HTMLDivElement>(null);

    // For shipments, find the related order to get customer details etc.
    const isShipment = 'shipment_date' in doc;
    const relatedOrder =
      isShipment && orders ? orders.find((o) => o.id === (doc as Shipment).orderId) : undefined;

    const handleDownloadPdf = () => {
      const input = previewRef.current;
      if (!input) return;

      // Temporary style changes for better PDF rendering
      const originalStyle = input.style.cssText;
      input.style.width = '210mm'; // A4 width
      input.style.minHeight = '297mm'; // A4 height
      input.style.height = 'auto';

      html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI approx
      }).then((canvas) => {
        // Revert style changes
        input.style.cssText = originalStyle;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const height = pdfWidth / ratio;

        if (height > pdfHeight) {
          // content is larger than one page
          let heightLeft = height;
          let position = 0;
          let page = 1;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
          heightLeft -= pdfHeight;

          while (heightLeft >= 0) {
            position = heightLeft - height; // top of new page relative to image top
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -pdfHeight * page, pdfWidth, height); // shift image up
            heightLeft -= pdfHeight;
            page++;
          }
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
        }

        const filename = isShipment
          ? `irsaliye-${(doc as any).trackingNumber || (doc as any).id}.pdf`
          : `belge-${doc.id}.pdf`;

        pdf.save(filename);
      });
    };

    const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLogo(URL.createObjectURL(file));
      }
    };

    const handleThemeColorChange = (e: ChangeEvent<HTMLInputElement>) => {
      setThemeColor(e.target.value);
    };

    const handleCustomNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setCustomNotes(e.target.value);
    };

    return (
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isShipment ? 'İrsaliye Önizleme ve Yazdır' : `Belge Hazırlama (ID: ${doc.id})`}
          </h1>
          <button
            onClick={handleDownloadPdf}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ></path>
            </svg>
            PDF İndir
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          {/* Left Side: Control Panel */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Özelleştirme
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo Yükle
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Yüklemek için tıklayın</span>
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tema Rengi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={handleThemeColorChange}
                    className="w-10 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                    {themeColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İçerik Seçenekleri
                </label>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProductDescriptions}
                      onChange={() => setShowProductDescriptions(!showProductDescriptions)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Ürün Açıklamalarını Göster
                    </span>
                  </label>
                  {!isShipment && (
                    <>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showUnitPrices}
                          onChange={() => setShowUnitPrices(!showUnitPrices)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Birim Fiyatları Göster
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVatDetails}
                          onChange={() => setShowVatDetails(!showVatDetails)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          KDV Detaylarını Göster
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Özel Notlar
                </label>
                <textarea
                  value={customNotes}
                  onChange={handleCustomNotesChange}
                  rows={4}
                  placeholder="Belge altına eklenecek notlar..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Live Preview */}
          <div className="lg:col-span-9 bg-gray-100 dark:bg-gray-900 p-6 rounded-lg shadow-inner overflow-auto flex justify-center items-start">
            <div className="bg-white shadow-lg w-[210mm] min-h-[297mm] transform scale-95 origin-top">
              <DocumentPreview
                ref={previewRef}
                doc={doc}
                logo={logo || undefined}
                themeColor={themeColor}
                showProductDescriptions={showProductDescriptions}
                showUnitPrices={showUnitPrices}
                showVatDetails={showVatDetails}
                customNotes={customNotes}
                customers={customers}
                products={products}
                relatedOrder={relatedOrder}
                allShipments={shipments}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PdfGenerator.displayName = 'PdfGenerator';

export default PdfGenerator;
