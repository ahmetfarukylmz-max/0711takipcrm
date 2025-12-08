import React from 'react';

const ProductSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">🏭 Ürün Yönetimi</h2>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ➕ Yeni Ürün Ekleme
        </h3>

        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            Quick Actions menüsünden <strong>"🏭 Yeni Ürün"</strong> seçin
          </li>
          <li className="ml-4">
            <strong>Ürün bilgilerini girin:</strong>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-sm">
              <li>Ürün Adı (Zorunlu)</li>
              <li>Ürün Kodu (SKU)</li>
              <li>Birim Fiyat (Zorunlu)</li>
              <li>Birim (Adet, Kg, Litre, vb.)</li>
              <li>Stok Miktarı</li>
              <li>Kategori</li>
            </ul>
          </li>
          <li>"Kaydet" butonuna tıklayın</li>
        </ol>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📂 Ürün Kategorileri
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['Hammadde', 'Yarı Mamul', 'Mamul', 'Hizmet', 'Diğer'].map((cat) => (
            <div
              key={cat}
              className="bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded text-center text-gray-700 dark:text-gray-200"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📊 Toplu Ürün İçe Aktarma
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Excel'den toplu ürün ekleyebilirsiniz:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Ürünler sayfasında "Excel ile İçe Aktar" butonuna tıklayın</li>
          <li>Örnek şablonu indirin</li>
          <li>Şablonu doldurun ve sisteme yükleyin</li>
        </ol>
      </div>
    </div>
  );
};

export default ProductSection;
