/**
 * Preload utilities for lazy-loaded components
 * Improves perceived performance by loading pages on hover
 */

// Preload functions for each lazy-loaded page
export const preloadDashboard = () => import('../components/pages/Dashboard');
export const preloadCustomers = () => import('../components/pages/Customers');
export const preloadProducts = () => import('../components/pages/Products');
export const preloadOrders = () => import('../components/pages/Orders');
export const preloadQuotes = () => import('../components/pages/Quotes');
export const preloadMeetings = () => import('../components/pages/Meetings');
export const preloadShipments = () => import('../components/pages/Shipments');
export const preloadReports = () => import('../components/pages/Reports');
export const preloadPdfGenerator = () => import('../components/pages/PdfGenerator');

// Map of page names to preload functions
export const preloadMap: Record<string, () => Promise<any>> = {
  'Anasayfa': preloadDashboard,
  'Müşteriler': preloadCustomers,
  'Ürünler': preloadProducts,
  'Siparişler': preloadOrders,
  'Teklifler': preloadQuotes,
  'Görüşmeler': preloadMeetings,
  'Sevkiyatlar': preloadShipments,
  'Raporlar': preloadReports,
  'PDF': preloadPdfGenerator,
};

// Preload a page by name
export const preloadPage = (pageName: string): void => {
  const preloadFn = preloadMap[pageName];
  if (preloadFn) {
    preloadFn().catch(() => {
      // Silently fail - preloading is not critical
    });
  }
};

// Preload multiple pages
export const preloadPages = (pageNames: string[]): void => {
  pageNames.forEach(preloadPage);
};

// Preload all pages (for idle time)
export const preloadAllPages = (): void => {
  Object.values(preloadMap).forEach(preloadFn => {
    preloadFn().catch(() => {
      // Silently fail
    });
  });
};
