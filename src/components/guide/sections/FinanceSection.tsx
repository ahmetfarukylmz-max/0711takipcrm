import React from 'react';

const FinanceSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        💰 Finansal İşlemler ve Cari Takip
      </h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Cari Hesap Yönetimi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="font-bold text-red-600 dark:text-red-400">Sipariş (Vadeli)</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Borç Artar (+)</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="font-bold text-green-600 dark:text-green-400">Tahsilat</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Borç Azalır (-)</div>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="font-bold text-yellow-600 dark:text-yellow-400">İade</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Borç Azalır (-)</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tahsilat İşlemleri</h3>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-4">
          <div className="text-2xl">💵</div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Kısmi Ödeme</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bir siparişin tamamını tahsil etmek zorunda değilsiniz. Örneğin 10.000 TL'lik
              siparişin 3.000 TL'sini nakit alıp, kalanı açık hesap bırakabilirsiniz.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-4">
          <div className="text-2xl">📝</div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Çek/Senet Takibi</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vadeli çekleri sisteme girdiğinizde, vade tarihi geldiğinde sistem sizi uyarır.
              Çeklerin durumunu (Portföyde, Tahsil Edildi, Karşılıksız) takip edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceSection;
