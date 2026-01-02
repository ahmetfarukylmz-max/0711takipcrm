import React, { useMemo } from 'react';
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
} from '../../components/icons';
import { formatCurrency } from '../../utils/formatters';

const SalesIntelligence: React.FC = () => {
  const { collections, setActivePage } = useStore();
  const { orders, teklifler: quotes, customers, gorusmeler: meetings } = collections;

  const data = useMemo(() => {
    return calculateIntelligence(orders, quotes, customers, meetings);
  }, [orders, quotes, customers, meetings]);

  const { monthlyForecast, tonnageForecast, riskyCustomers, insights, conversionRate } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Üst Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ay Sonu Tahmini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
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
            <span className="text-2xl font-bold text-slate-800">
              {formatCurrency(monthlyForecast.realistic)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Mevcut Hız: {formatCurrency(monthlyForecast.currentTotal)}
          </p>
          <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity">
            <ChartBarIcon className="w-20 h-20" />
          </div>
        </div>

        {/* Tonaj Tahmini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <TrendingUpIcon className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Tahmini Tonaj</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {tonnageForecast.projected.toFixed(1)} {tonnageForecast.unit}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Bugüne Kadar: {tonnageForecast.current.toFixed(1)} {tonnageForecast.unit}
          </p>
          <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity">
            <TargetIcon className="w-20 h-20" />
          </div>
        </div>

        {/* Dönüşüm Oranı */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowRightIcon className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Teklif Dönüşüm (Son 3 Ay)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">%{conversionRate.toFixed(1)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Başarılı Satış Oranı</p>
          <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUpIcon className="w-20 h-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Akıllı Öneriler & Riskler */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LightbulbIcon className="text-amber-500 w-5 h-5" />
              Yapay Zeka Brifingi
            </h2>
          </div>

          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border flex gap-4 transition-all hover:shadow-md ${
                    insight.type === 'risk'
                      ? 'bg-rose-50 border-rose-100'
                      : 'bg-indigo-50 border-indigo-100'
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
                      className={`font-semibold text-sm ${insight.type === 'risk' ? 'text-rose-900' : 'text-indigo-900'}`}
                    >
                      {insight.title}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${insight.type === 'risk' ? 'text-rose-700' : 'text-indigo-700'}`}
                    >
                      {insight.message}
                    </p>
                    {insight.actionLabel && (
                      <button
                        onClick={() => insight.actionPath && setActivePage(insight.actionPath)}
                        className={`mt-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
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
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                Şu an için kritik bir uyarı veya fırsat tespit edilmedi.
              </div>
            )}
          </div>
        </div>

        {/* Riskli Müşteriler Listesi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UsersIcon className="text-rose-500 w-5 h-5" />
              Kayıp Riski Olan Müşteriler
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {riskyCustomers.length > 0 ? (
              riskyCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      {customer.customerName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{customer.reason}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 mb-1">
                      RİSK: %{customer.riskScore}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {customer.lastOrderDays} Gündür Alım Yok
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                Tüm müşteriler düzenli alım döngüsünde görünüyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesIntelligence;
