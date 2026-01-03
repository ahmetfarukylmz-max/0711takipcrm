import React, { useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import { calculateIntelligence, SmartAction } from '../../services/intelligenceService';
import CustomerRiskAnalysisModal from './CustomerRiskAnalysisModal';
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
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ShieldIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
} from '../../components/icons';
import { formatCurrency, formatPhoneNumberForWhatsApp, formatDate } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const SalesIntelligence: React.FC = () => {
  const { collections, setActivePage, setPrefilledQuote } = useStore();
  // payments koleksiyonunu ekledik
  const {
    orders,
    teklifler: quotes,
    customers,
    gorusmeler: meetings,
    products,
    payments,
  } = collections;

  const [activeTab, setActiveTab] = useState<'actions' | 'customers' | 'forecast'>('actions');
  const [selectedRiskCustomerId, setSelectedRiskCustomerId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | 'financial' | 'sales' | 'relationship'>(
    'all'
  );

  const data = useMemo(() => {
    // payments parametresi eklendi
    return calculateIntelligence(orders, quotes, customers, meetings, products, payments || []);
  }, [orders, quotes, customers, meetings, products, payments]);

  const { dailyActions, customerProfiles, monthlyForecast } = data;

  const filteredActions = dailyActions.filter((action) => {
    if (actionFilter === 'all') return true;
    if (actionFilter === 'financial') return action.type === 'financial';
    if (actionFilter === 'sales') return action.type === 'sales' || action.type === 'stock';
    if (actionFilter === 'relationship') return action.type === 'relationship';
    return true;
  });

  const handleCreateQuote = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setPrefilledQuote({
        customerId: customer.id,
        items: [],
      });
      setActivePage('Teklifler');
      setSelectedRiskCustomerId(null);
      toast.success('Teklif taslağı oluşturuldu');
    }
  };

  const handleWhatsApp = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.phone) {
      const phone = formatPhoneNumberForWhatsApp(customer.phone);
      if (phone) {
        window.open(`https://wa.me/${phone}`, '_blank');
        setSelectedRiskCustomerId(null);
      } else {
        toast.error('Geçersiz telefon numarası');
      }
    } else {
      toast.error('Müşterinin telefonu kayıtlı değil');
    }
  };

  const getActionIcon = (type: SmartAction['type']) => {
    switch (type) {
      case 'financial':
        return <CurrencyDollarIcon className="w-5 h-5 text-rose-600" />;
      case 'sales':
        return <ShoppingCartIcon className="w-5 h-5 text-blue-600" />;
      case 'relationship':
        return <UsersIcon className="w-5 h-5 text-purple-600" />;
      case 'stock':
        return <AlertTriangleIcon className="w-5 h-5 text-amber-600" />;
      default:
        return <LightbulbIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (type: SmartAction['type']) => {
    switch (type) {
      case 'financial':
        return 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800';
      case 'sales':
        return 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800';
      case 'relationship':
        return 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800';
      case 'stock':
        return 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TABS */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        {[
          { id: 'actions', label: 'Günlük Aksiyon Planı', icon: CheckCircleIcon },
          { id: 'customers', label: 'Müşteri Sağlık Matrisi', icon: ShieldIcon },
          { id: 'forecast', label: 'Finansal Öngörü', icon: ChartBarIcon },
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

      {/* --- TAB: ACTIONS --- */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'financial', label: 'Finans & Risk' },
              { id: 'sales', label: 'Satış & Stok' },
              { id: 'relationship', label: 'İletişim' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActionFilter(filter.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  actionFilter === filter.id
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => (
                <div
                  key={action.id}
                  className={`p-5 rounded-2xl border flex gap-5 transition-all hover:shadow-md ${getActionColor(action.type)}`}
                >
                  <div className="mt-1 p-2 bg-white/60 dark:bg-black/20 rounded-xl h-fit">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 dark:text-white">{action.title}</h4>
                      {action.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          Acil
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {action.message}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (action.actionPath) setActivePage(action.actionPath);

                          if (action.type === 'financial' && action.customerId) {
                            handleWhatsApp(action.customerId);
                          } else if (action.type === 'sales' && action.customerId) {
                            handleCreateQuote(action.customerId);
                          } else if (action.type === 'relationship' && action.customerId) {
                            handleWhatsApp(action.customerId);
                          }
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        {action.actionLabel}
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>

                      {action.customerId && (
                        <button
                          onClick={() => setSelectedRiskCustomerId(action.customerId!)}
                          className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                          Detaylı Analiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700">
                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Harika! Her Şey Yolunda
                </h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Şu an için acil müdahale gerektiren bir durum tespit edilmedi. Tüm
                  müşterilerinizle iletişiminiz güncel ve finansal riskler kontrol altında.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: CUSTOMER HEALTH MATRIX --- */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-300 font-medium">
                  <tr>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Finansal Risk</th>
                    <th className="px-6 py-4">İlişki Durumu</th>
                    <th className="px-6 py-4">Son Sipariş</th>
                    <th className="px-6 py-4">Tahmini Sipariş</th>
                    <th className="px-6 py-4 text-right">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {customerProfiles
                    .sort((a, b) => b.financialRiskScore - a.financialRiskScore)
                    .map((profile) => (
                      <tr
                        key={profile.customerId}
                        className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {profile.customerName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${profile.financialRiskScore > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${profile.financialRiskScore}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-bold ${profile.financialRiskScore > 50 ? 'text-rose-600' : 'text-slate-500'}`}
                            >
                              {profile.financialRiskScore}/100
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500"
                                style={{ width: `${profile.engagementScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">
                              {profile.engagementScore}/100
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-gray-300">
                          {profile.lastOrderDate ? formatDate(profile.lastOrderDate) : '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-gray-300">
                          {profile.predictedNextOrderDate ? (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(profile.predictedNextOrderDate)}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(profile.totalDebt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: FORECAST --- */}
      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-slate-500 font-medium text-sm mb-2">Mevcut Ciro</h3>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(monthlyForecast.currentTotal)}
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TargetIcon className="w-24 h-24" />
            </div>
            <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
              Gerçekçi Ay Sonu Tahmini
            </h3>
            <div className="text-3xl font-bold text-indigo-900 dark:text-white">
              {formatCurrency(monthlyForecast.realistic)}
            </div>
            <p className="text-xs text-indigo-500 mt-2">
              Mevcut hız + Bekleyen sıcak tekliflerin %30'u
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
              İyimser Hedef
            </h3>
            <div className="text-3xl font-bold text-emerald-900 dark:text-white">
              {formatCurrency(monthlyForecast.optimistic)}
            </div>
            <p className="text-xs text-emerald-500 mt-2">Tüm potansiyel fırsatlar zorlanırsa</p>
          </div>
        </div>
      )}

      {selectedRiskCustomerId && (
        <CustomerRiskAnalysisModal
          isOpen={true}
          onClose={() => setSelectedRiskCustomerId(null)}
          customerId={selectedRiskCustomerId}
          onCreateQuote={() => handleCreateQuote(selectedRiskCustomerId)}
          onWhatsApp={() => handleWhatsApp(selectedRiskCustomerId)}
        />
      )}
    </div>
  );
};

export default SalesIntelligence;
