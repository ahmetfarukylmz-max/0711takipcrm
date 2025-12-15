import React from 'react';

const PurchasingSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        🛒 Satınalma Yönetimi (Tedarik Zinciri)
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Satınalma modülü, <strong>Kanban (Pano)</strong> yapısıyla çalışır. Bu, taleplerin görsel
        olarak soldan sağa akmasını sağlar.
      </p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          İş Akışı: Talepten Depoya
        </h3>

        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                Talep Oluşturma (Talep Edildi)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Depo sorumlusu veya satışçı bir ürüne ihtiyaç duyduğunda "Yeni Talep" butonu ile
                talep açar. Kart "Talep Edildi" sütununa düşer.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                Pazar Araştırması (Araştırılıyor)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Satınalma birimi fiyat toplar. Karta tıklayıp "Tedarikçi Teklifleri" sekmesinden
                alınan fiyatlar girilir.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                Sipariş Verme (Sipariş Verildi)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                En uygun teklif "Onayla" butonu ile seçilir. Kart otomatik olarak "Sipariş Verildi"
                sütununa taşınır.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Mal Kabul (Depoya Girdi)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ürünler geldiğinde kart "Depoya Girdi" sütununa sürüklenir. Sistem otomatik stok
                girişi yapmak isteyip istemediğinizi sorar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasingSection;
