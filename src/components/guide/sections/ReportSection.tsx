import React from 'react';

const ReportSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📊 Raporlar</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg shadow">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <span className="text-xl">💰</span> Satış Raporu
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>Tarih aralığındaki satışlar</li>
            <li>Toplam ciro</li>
            <li>Ürün bazlı satış</li>
            <li>Müşteri bazlı satış</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg shadow">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
            <span className="text-xl">👥</span> Müşteri Raporu
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>En çok alım yapan müşteriler</li>
            <li>Yeni müşteriler</li>
            <li>Pasif müşteriler</li>
            <li>Müşteri sayısı trendi</li>
          </ul>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg shadow">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
            <span className="text-xl">🏭</span> Ürün Raporu
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>En çok satan ürünler</li>
            <li>Stok durumu</li>
            <li>Kar marjı analizi</li>
            <li>Kategori bazlı satış</li>
          </ul>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-lg shadow">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
            <span className="text-xl">💳</span> Finansal Rapor
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>Aylık gelir</li>
            <li>Tahsilat durumu</li>
            <li>Bekleyen ödemeler</li>
            <li>Kar/Zarar</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📥 Rapor Dışa Aktarma
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Excel Formatı</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>Rapor oluşturun</li>
              <li>"Excel'e Aktar" butonuna tıklayın</li>
              <li>XLSX dosyası indirilir</li>
            </ol>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">PDF Formatı</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>Rapor oluşturun</li>
              <li>"PDF İndir" butonuna tıklayın</li>
              <li>Profesyonel formatta rapor</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;
