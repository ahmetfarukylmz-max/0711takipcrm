import React, { lazy, Suspense, useState } from 'react';
import GuideNavigation from './GuideNavigation';

// Lazy load sections
const IntroSection = lazy(() => import('./sections/IntroSection'));
const DashboardSection = lazy(() => import('./sections/DashboardSection'));
const CustomerSection = lazy(() => import('./sections/CustomerSection'));
const ProductSection = lazy(() => import('./sections/ProductSection'));
const OrderSection = lazy(() => import('./sections/OrderSection'));
const QuoteSection = lazy(() => import('./sections/QuoteSection'));
const MeetingSection = lazy(() => import('./sections/MeetingSection'));
const ShipmentSection = lazy(() => import('./sections/ShipmentSection'));
const ReportSection = lazy(() => import('./sections/ReportSection'));
const MobileSection = lazy(() => import('./sections/MobileSection'));
const TipsSection = lazy(() => import('./sections/TipsSection'));

// New Sections
const PurchasingSection = lazy(() => import('./sections/PurchasingSection'));
const CostingSection = lazy(() => import('./sections/CostingSection'));
const FinanceSection = lazy(() => import('./sections/FinanceSection'));

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('giris');

  const sections = [
    { id: 'giris', title: '🚀 Hızlı Başlangıç', icon: '🚀', Component: IntroSection },
    { id: 'satinalma', title: '🛒 Satınalma (Kanban)', icon: '🛒', Component: PurchasingSection },
    { id: 'gorusmeler', title: '💬 Satış & CRM', icon: '💼', Component: MeetingSection },
    { id: 'teklifler', title: '📄 Teklifler (Smart)', icon: '📄', Component: QuoteSection },
    { id: 'siparisler', title: '📦 Sipariş & Sevkiyat', icon: '📦', Component: OrderSection },
    { id: 'stok', title: '🏭 Stok & Maliyet', icon: '🏭', Component: CostingSection },
    { id: 'finans', title: '💰 Finans & Cari', icon: '💰', Component: FinanceSection },
    { id: 'raporlar', title: '📊 Raporlar', icon: '📊', Component: ReportSection },
    { id: 'mobil', title: '📱 Mobil Kullanım', icon: '📱', Component: MobileSection },
    { id: 'ipuclari', title: '💡 İpuçları', icon: '💡', Component: TipsSection },
  ];

  const CurrentComponent = sections.find((s) => s.id === activeSection)?.Component || IntroSection;

  return (
    <div className="flex h-[80vh] bg-gray-50 dark:bg-gray-900 relative">
      <GuideNavigation
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-6 lg:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto pb-20">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CurrentComponent />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
