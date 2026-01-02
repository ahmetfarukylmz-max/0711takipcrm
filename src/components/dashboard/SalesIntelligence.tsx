import React, { useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import { calculateIntelligence } from '../../services/intelligenceService';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  TargetIcon,
  ArrowRightIcon,
  ChartBarIcon,
  UsersIcon,
  WhatsAppIcon,
  DocumentTextIcon,
  ClockIcon,
} from '../../components/icons';
import { formatCurrency, formatPhoneNumberForWhatsApp } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const SalesIntelligence: React.FC = () => {
  const { collections, setActivePage, setPrefilledQuote } = useStore();
  const { orders, teklifler: quotes, customers, gorusmeler: meetings, products } = collections;
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'simulator'>('overview');

  // Simulator State
  const [simConversionRate, setSimConversionRate] = useState(0); // +% increase
  const [simOrderValue, setSimOrderValue] = useState(0); // +% increase

  const data = useMemo(() => {
    return calculateIntelligence(orders, quotes, customers, meetings, products);
  }, [orders, quotes, customers, meetings, products]);

  const {
    monthlyForecast,
    tonnageForecast,
    riskyCustomers,
    insights,
    conversionRate,
    segments,
    recommendations,
    hotHours,
  } = data;

  // Simulator Calculations
  const simulatedForecast = useMemo(() => {
    const baseTotal = monthlyForecast.realistic;
    const conversionMultiplier = 1 + simConversionRate / 100;
    const valueMultiplier = 1 + simOrderValue / 100;
    return baseTotal * conversionMultiplier * valueMultiplier;
  }, [monthlyForecast.realistic, simConversionRate, simOrderValue]);

  const handleCreateQuote = (customerId: string, productId?: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setPrefilledQuote({
        customerId: customer.id,
        items: productId
          ? [
              {
                productId,
                productName: products.find((p) => p.id === productId)?.name,
                quantity: 1,
                unit_price: 0,
                total: 0,
              },
            ]
          : [],
      });
      setActivePage('Teklifler');
      toast.success('Teklif taslağı oluşturuldu');
    }
  };

  const handleWhatsApp = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.phone) {
      const phone = formatPhoneNumberForWhatsApp(customer.phone);
      if (phone) {
        window.open(`https://wa.me/${phone}`, '_blank');
      } else {
        toast.error('Geçersiz telefon numarası');
      }
    } else {
      toast.error('Müşterinin telefonu kayıtlı değil');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TABS */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        {[
          { id: 'overview', label: 'Genel Bakış', icon: ChartBarIcon },
          { id: 'customers', label: 'Müşteri Analizi', icon: UsersIcon },
          { id: 'simulator', label: 'Hedef Simülatörü', icon: TargetIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5
              transition-all duration-200
              ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow dark:bg-slate-700 dark:text-blue-100'
                  : 'text-slate-600 hover:bg-white/[0.12] hover:text-blue-600 dark:text-slate-400'
              }
            `}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <TargetIcon className="w-5 h-5" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    monthlyForecast.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {monthlyForecast.trend === 'up' ? (
                    <TrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4" />
                  )}
                  %{Math.abs(monthlyForecast.growthRate).toFixed(1)}
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Tahmini Ay Sonu Ciro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {formatCurrency(monthlyForecast.realistic)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Mevcut: {formatCurrency(monthlyForecast.currentTotal)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Altın Saatler</h3>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  {hotHours.day}
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {hotHours.hour}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">En yüksek sipariş yoğunluğu</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <ArrowRightIcon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Dönüşüm Oranı</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  %{conversionRate.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Tekliflerin siparişe dönme oranı</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LightbulbIcon className="text-amber-500 w-5 h-5" />
                Yapay Zeka Brifingi
              </h2>
              <div className="space-y-3">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border flex gap-4 transition-all hover:shadow-md ${
                        insight.type === 'risk'
                          ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800'
                          : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800'
                      }`}
                    >
                      <div
                        className={`mt-1 ${insight.type === 'risk' ? 'text-rose-600' : 'text-indigo-600'}`}
                      >
                        {insight.type === 'risk' ? (
                          <AlertTriangleIcon className="w-5 h-5" />
                        ) : (
                          <LightbulbIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-semibold text-sm ${insight.type === 'risk' ? 'text-rose-900 dark:text-rose-100' : 'text-indigo-900 dark:text-indigo-100'}`}
                        >
                          {insight.title}
                        </h4>
                        <p
                          className={`text-sm mt-1 ${insight.type === 'risk' ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'}`}
                        >
                          {insight.message}
                        </p>
                        <div className="flex gap-2 mt-3">
                          {insight.actionLabel && (
                            <button
                              onClick={() => {
                                if (insight.actionPath) setActivePage(insight.actionPath);
                                if (
                                  insight.actionLabel === 'Teklif Hazırla' &&
                                  insight.relatedCustomerId
                                )
                                  handleCreateQuote(
                                    insight.relatedCustomerId,
                                    insight.relatedProductId
                                  );
                              }}
                              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                                insight.type === 'risk'
                                  ? 'text-rose-600 hover:text-rose-800'
                                  : 'text-indigo-600 hover:text-indigo-800'
                              }`}
                            >
                              {insight.actionLabel}
                              <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl">
                    Şu an için kritik bir uyarı yok.
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TargetIcon className="text-blue-500 w-5 h-5" />
                Ürün Tavsiyeleri (Cross-Sell)
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm divide-y divide-slate-50 dark:divide-gray-700">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                            {rec.customerName}
                          </h4>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                            %{rec.confidenceScore} Eşleşme
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                          👉 <span className="font-medium text-blue-600">{rec.productName}</span>{' '}
                          önerilebilir.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rec.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateQuote(rec.customerId, rec.productId)}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                          title="Teklif Hazırla"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm italic">
                    Yeterli veri oluştuğunda burada ürün önerileri çıkacak.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- TAB: CUSTOMERS --- */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Şampiyonlar', key: 'Şampiyon', color: 'bg-emerald-100 text-emerald-800' },
              { label: 'Sadık', key: 'Sadık', color: 'bg-blue-100 text-blue-800' },
              { label: 'Riskli', key: 'Riskli', color: 'bg-rose-100 text-rose-800' },
              { label: 'Potansiyel', key: 'Potansiyel', color: 'bg-amber-100 text-amber-800' },
            ].map((seg) => {
              const count = segments.filter((s) => s.segment === seg.key).length;
              return (
                <div
                  key={seg.key}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-slate-600 dark:text-gray-300">{seg.label}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${seg.color}`}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-300 font-medium">
                <tr>
                  <th className="px-6 py-4">Müşteri</th>
                  <th className="px-6 py-4">Segment</th>
                  <th className="px-6 py-4">Skor</th>
                  <th className="px-6 py-4">Toplam Harcama</th>
                  <th className="px-6 py-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {segments
                  .sort((a, b) => b.score - a.score)
                  .map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            customer.segment === 'Şampiyon'
                              ? 'bg-emerald-100 text-emerald-800'
                              : customer.segment === 'Riskli'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${customer.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{customer.score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-gray-300">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleWhatsApp(customer.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCreateQuote(customer.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Teklif Hazırla"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: SIMULATOR --- */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm h-fit">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Senaryo Ayarları</h3>
              <p className="text-sm text-slate-500 mb-6">
                Aşağıdaki parametreleri değiştirerek ay sonu cironuzun nasıl etkileneceğini simüle
                edin.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Dönüşüm Oranı Artışı
                    </label>
                    <span className="text-sm font-bold text-blue-600">+{simConversionRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={simConversionRate}
                    onChange={(e) => setSimConversionRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Tekliflerin onaya dönüşme hızını artırırsanız.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Ortalama Sipariş Tutarı
                    </label>
                    <span className="text-sm font-bold text-green-600">+{simOrderValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={simOrderValue}
                    onChange={(e) => setSimOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Müşterileri daha pahalı ürünlere yönlendirirseniz.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setSimConversionRate(0);
                  setSimOrderValue(0);
                }}
                className="w-full py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Sıfırla
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <TargetIcon className="w-64 h-64" />
            </div>

            <h3 className="text-xl font-medium opacity-90 mb-2">Simüle Edilmiş Ay Sonu Ciro</h3>
            <div className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              {formatCurrency(simulatedForecast)}
            </div>

            <div className="flex gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
                <span className="block text-xs opacity-75 uppercase tracking-wider">Mevcut</span>
                <span className="text-xl font-bold">
                  {formatCurrency(monthlyForecast.realistic)}
                </span>
              </div>
              <div className="bg-emerald-500/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-emerald-400/30">
                <span className="block text-xs text-emerald-100 uppercase tracking-wider">
                  Fark (Kazanç)
                </span>
                <span className="text-xl font-bold text-emerald-50">
                  +{formatCurrency(simulatedForecast - monthlyForecast.realistic)}
                </span>
              </div>
            </div>

            <p className="mt-8 text-center text-indigo-100 max-w-lg text-sm leading-relaxed">
              Bu hedefe ulaşmak için yaklaşık{' '}
              <span className="font-bold text-white">
                {Math.ceil(
                  (simulatedForecast - monthlyForecast.realistic) /
                    (monthlyForecast.currentTotal / 20)
                )}
              </span>{' '}
              ekstra satış yapmanız gerekiyor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesIntelligence;
