import React from 'react';

const QuoteSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        📄 Teklif Hazırlama (Smart Quote)
      </h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Teklif Süreci</h3>
        <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
          <li className="mb-10 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
              1
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">Teklif Oluştur</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Görüşme sonucunda müşteriye özel fiyatlarla teklif hazırlayın. Geçerlilik tarihi ve
              ödeme şartlarını belirtin.
            </p>
          </li>
          <li className="mb-10 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
              2
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">PDF Paylaşımı</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Teklifi profesyonel PDF formatında indirin ve WhatsApp veya E-posta ile gönderin.
            </p>
          </li>
          <li className="ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-800 dark:bg-green-900">
              3
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">Siparişe Dönüştür</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Onaylanan teklifi tek tıkla "Siparişe Dönüştür" diyerek siparişleştirin. Veri tekrarı
              yapmanıza gerek kalmaz.
            </p>
          </li>
        </ol>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-800">
        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-3">
          🚫 Teklif Reddedilirse (Önemli!)
        </h3>
        <p className="text-sm text-red-800 dark:text-red-200 mb-4">
          Müşteri teklifi reddederse, durumu mutlaka "Reddedildi" yapın. Sistem size nedenini
          soracaktır:
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-700 text-sm">
          <strong>Neden Kaydediyoruz?</strong>
          <br />
          Eğer "Fiyat Yüksek" seçeneğini işaretlerseniz, müşterinin hedef fiyatını ve varsa rakip
          firma ismini girebilirsiniz. Bu veri, <strong>Kayıp Analizi</strong> raporlarında "Fiyat
          yüzünden X TL kaybettik" şeklinde karşınıza çıkar ve strateji geliştirmenizi sağlar.
        </div>
      </div>
    </div>
  );
};

export default QuoteSection;
