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

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('giris');

  const sections = [
    { id: 'giris', title: '🔐 Giriş Yapma', icon: '🔐', Component: IntroSection },
    { id: 'dashboard', title: '🏠 Ana Sayfa', icon: '🏠', Component: DashboardSection },
    { id: 'musteriler', title: '👥 Müşteri Yönetimi', icon: '👥', Component: CustomerSection },
    { id: 'urunler', title: '🏭 Ürün Yönetimi', icon: '🏭', Component: ProductSection },
    { id: 'siparisler', title: '📦 Sipariş Yönetimi', icon: '📦', Component: OrderSection },
    { id: 'teklifler', title: '📄 Teklif Hazırlama', icon: '📄', Component: QuoteSection },
    { id: 'gorusmeler', title: '💬 Görüşme Takibi', icon: '💬', Component: MeetingSection },
    { id: 'kargo', title: '🚚 Kargo Yönetimi', icon: '🚚', Component: ShipmentSection },
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

      <div className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <CurrentComponent />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
