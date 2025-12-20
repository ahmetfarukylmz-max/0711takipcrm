import React, { memo, useState } from 'react';
import { Product, Order, Customer, Shipment, BestSellingProduct } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters'; // Import formatCurrency and formatDate

// Placeholder components for tab content (will be created in subsequent steps)
interface StockCardsWidgetProps {
  lowStockProducts: Product[];
  products: Product[]; // Might need all products for detail view
  setActivePage: (page: string) => void;
  // Add other necessary props like onAddStock or onUpdateStock
}
const StockCardsWidget: React.FC<StockCardsWidgetProps> = memo(
  ({ lowStockProducts, setActivePage }) => {
    return (
      <div>
        {/* Low Stock Alert Banner */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-red-100 text-red-600 p-2 rounded-lg text-lg">⚠️</span>
              <div>
                <h4 className="font-bold text-gray-900">Stok Alarmı</h4>
                <p className="text-xs text-red-700">
                  {lowStockProducts.length} ürün kritik seviyenin altında.
                </p>
              </div>
            </div>
            <button className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium">
              Satınalma Listesi Oluştur
            </button>
          </div>
        )}

        {/* Cards Carousel */}
        <div className="flex gap-4 overflow-x-auto hide-scroll pb-4">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map((product) => {
              const stockPercentage = product.minimum_stock
                ? (product.stock_quantity! / product.minimum_stock) * 100
                : 0;
              let statusLabel = 'YETERLİ';
              let statusColor = 'green';
              let progressColor = 'green-500';
              let borderColor = 'gray-200';

              if (stockPercentage <= 15) {
                statusLabel = 'KRİTİK';
                statusColor = 'red';
                progressColor = 'red-500';
                borderColor = 'red-300';
              } else if (stockPercentage <= 40) {
                statusLabel = 'AZALDI';
                statusColor = 'orange';
                progressColor = 'orange-500';
                borderColor = 'orange-300';
              } else if (stockPercentage <= 70) {
                statusLabel = 'UYARI';
                statusColor = 'yellow';
                progressColor = 'yellow-500';
                borderColor = 'yellow-300';
              }

              // Fallback for emojis, could be more dynamic with product categories
              const productEmoji =
                product.category === 'Kereste' ? '🪵' : product.category === 'Metal' ? '🔩' : '📦';

              return (
                <div
                  key={product.id}
                  className={`min-w-[220px] bg-white p-4 rounded-xl border border-${borderColor} shadow-sm hover:border-${statusColor}-300 hover:shadow-md transition-all`}
                  onClick={() => {
                    setActivePage('Ürünler');
                  }} // Navigate to products page on click
                >
                  <div className="flex justify-between">
                    <span className="text-2xl">{productEmoji}</span>
                    <span
                      className={`bg-${statusColor}-100 text-${statusColor}-700 text-[10px] font-bold px-2 py-0.5 rounded-full h-fit`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">{product.name}</h4>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Stok:</span>
                      <span className={`font-bold text-${statusColor}-600`}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`bg-${progressColor} h-1.5 rounded-full`}
                        style={{ width: `${stockPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); /* Implement add stock logic */
                    }}
                    className="w-full mt-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded hover:bg-gray-100"
                  >
                    Stok Ekle
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center w-full text-gray-500">
              Kritik seviyede ürün bulunmuyor.
            </div>
          )}
        </div>
      </div>
    );
  }
);

interface ShipmentListWidgetProps {
  upcomingDeliveries: Order[]; // Orders with upcoming deliveries
  customers: Customer[];
  shipments: Shipment[];
  setActivePage: (page: string) => void;
  // Add other necessary props like onMarkDelivered
}
const ShipmentListWidget: React.FC<ShipmentListWidgetProps> = memo(
  ({ upcomingDeliveries, customers, setActivePage }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm uppercase">Yaklaşan Teslimatlar</h3>
          <button
            onClick={() => setActivePage('Sevkiyat')}
            className="text-xs text-blue-600 hover:underline"
          >
            Tümünü Gör
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingDeliveries.length > 0 ? (
            upcomingDeliveries.map((order) => {
              const customer = customers.find((c) => c.id === order.customerId);
              const deliveryDate = order.delivery_date ? new Date(order.delivery_date) : null;
              const today = new Date();
              const tomorrow = new Date();
              tomorrow.setDate(today.getDate() + 1);

              let dateLabel = deliveryDate ? formatDate(deliveryDate.toISOString()) : 'Bilinmiyor';
              let dateColor = 'text-gray-600';
              if (deliveryDate) {
                if (deliveryDate.toDateString() === today.toDateString()) {
                  dateLabel = 'Bugün';
                  dateColor = 'text-green-600';
                } else if (deliveryDate.toDateString() === tomorrow.toDateString()) {
                  dateLabel = 'Yarın';
                  dateColor = 'text-orange-600';
                } else if (deliveryDate < today) {
                  dateLabel = 'Gecikti';
                  dateColor = 'text-red-600';
                }
              }

              let statusBg = 'bg-gray-100';
              let statusText = 'text-gray-600';
              if (order.status === 'Hazırlanıyor') {
                statusBg = 'bg-yellow-100';
                statusText = 'text-yellow-700';
              } else if (order.status === 'Tamamlandı' || order.status === 'Teslim Edildi') {
                statusBg = 'bg-green-100';
                statusText = 'text-green-700';
              } else if (order.status === 'İptal Edildi') {
                statusBg = 'bg-red-100';
                statusText = 'text-red-700';
              }

              return (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setActivePage('Siparişler')}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {customer?.name || 'Bilinmeyen Müşteri'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Sipariş #{order.id?.slice(-4)} • {order.address?.city || 'Şehir Yok'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold text-sm ${dateColor}`}>{dateLabel}</span>
                    <span
                      className={`inline-block px-2 py-0.5 ${statusBg} ${statusText} text-[10px] font-bold rounded mt-1`}
                    >
                      {order.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">Yaklaşan teslimat bulunmuyor.</div>
          )}
        </div>
      </div>
    );
  }
);

interface BestsellersWidgetProps {
  bestSellingProducts: BestSellingProduct[];
  setActivePage: (page: string) => void;
  // Add other necessary props
}
const BestsellersWidget: React.FC<BestsellersWidgetProps> = memo(
  ({ bestSellingProducts, setActivePage }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm uppercase">En Çok Satan Ürünler</h3>
          <button
            onClick={() => setActivePage('products')}
            className="text-xs text-blue-600 hover:underline"
          >
            Tümünü Gör
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {bestSellingProducts.length > 0 ? (
            bestSellingProducts.map((product, index) => (
              <div
                key={product.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setActivePage('Ürünler')}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-400">{index + 1}.</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500">
                      {product.customers.length} müşteri • {product.quantity} {product.unit} satıldı
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-gray-900 text-sm">
                    {formatCurrency(product.revenue)}
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded mt-1">
                    Ciro
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">Henüz çok satan ürün bulunmuyor.</div>
          )}
        </div>
      </div>
    );
  }
);

interface OperationalTabbedContentProps {
  lowStockProducts: Product[];
  products: Product[];
  upcomingDeliveries: Order[];
  bestSellingProducts: BestSellingProduct[];
  customers: Customer[]; // Pass customers for shipments, etc.
  shipments: Shipment[]; // Pass shipments for shipment details
  setActivePage: (page: string) => void;
}

const OperationalTabbedContent: React.FC<OperationalTabbedContentProps> = memo(
  ({
    lowStockProducts,
    products,
    upcomingDeliveries,
    bestSellingProducts,
    customers,
    shipments,
    setActivePage,
  }) => {
    const [activeTab, setActiveTab] = useState<'stock' | 'shipments' | 'bestsellers'>('stock');

    return (
      <div className="lg:col-span-7 space-y-8">
        {/* TABS HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stock'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Stok & Ürünler
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'shipments'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🚚 Sevkiyatlar
          </button>
          <button
            onClick={() => setActiveTab('bestsellers')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'bestsellers'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🏆 En Çok Satanlar
          </button>
        </div>

        {/* TAB CONTENT: STOCK */}
        {activeTab === 'stock' && (
          <div
            className="transition ease-out duration-200"
            style={{ '--tw-enter-opacity': '0', '--tw-enter-translate-y': '0.5rem' }}
          >
            <StockCardsWidget
              lowStockProducts={lowStockProducts}
              products={products}
              setActivePage={setActivePage}
            />
          </div>
        )}

        {/* TAB CONTENT: SHIPMENTS */}
        {activeTab === 'shipments' && (
          <div
            className="transition ease-out duration-200"
            style={{ '--tw-enter-opacity': '0', '--tw-enter-translate-y': '0.5rem' }}
          >
            <ShipmentListWidget
              upcomingDeliveries={upcomingDeliveries}
              customers={customers}
              shipments={shipments}
              setActivePage={setActivePage}
            />
          </div>
        )}

        {/* TAB CONTENT: BEST SELLERS */}
        {activeTab === 'bestsellers' && (
          <div
            className="transition ease-out duration-200"
            style={{ '--tw-enter-opacity': '0', '--tw-enter-translate-y': '0.5rem' }}
          >
            <BestsellersWidget
              bestSellingProducts={bestSellingProducts}
              setActivePage={setActivePage}
            />
          </div>
        )}
      </div>
    );
  }
);

OperationalTabbedContent.displayName = 'OperationalTabbedContent';

export default OperationalTabbedContent;
