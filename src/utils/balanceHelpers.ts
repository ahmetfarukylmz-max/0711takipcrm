import { Customer, Order, Payment, Shipment, ReturnInvoice } from '../types';
import { EXCHANGE_RATES } from '../constants';

// Define types for Balances logic
export type BalanceStatus = 'alacak' | 'borc' | 'dengede';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface CustomerBalance {
  customer: Customer;
  totalOrders: number;
  totalPayments: number;
  balance: number;
  status: BalanceStatus;
  statusText: string;
  icon: string;
  color: string;
  orderDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    orderNumber?: string;
    status?: string;
  }>;
  paymentDetails: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
  }>;
  dueDateInfo: {
    overduePayments: Payment[];
    upcomingPayments: Payment[];
    totalOverdueAmount: number;
    totalUpcomingAmount: number;
  };
  riskAnalysis: {
    riskScore: number; // 0-100
    riskLevel: RiskLevel;
    riskLabel: string;
    riskColor: string;
    factors: {
      overdueCount: number;
      averageDelayDays: number;
      overdueRatio: number; // % of total debt
      balanceRatio: number; // debt / total orders
    };
  };
}

export interface BalancesSummary {
  totalAlacak: number;
  totalBorc: number;
  netBalance: number;
  dengedeCount: number;
  totalOverdue: number;
  totalUpcoming: number;
  overdueCount: number;
  upcomingCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

// Currency Conversion Rates
const convertToTRY = (amount: number, currency: string) => {
  if (currency === 'USD') return amount * EXCHANGE_RATES.USD;
  if (currency === 'EUR') return amount * EXCHANGE_RATES.EUR;
  return amount;
};

/**
 * Calculates balances for all customers based on orders and payments.
 */
export const calculateAllCustomerBalances = (
  customers: Customer[],
  orders: Order[],
  payments: Payment[],
  shipments: Shipment[] = [],
  returns: ReturnInvoice[] = []
): CustomerBalance[] => {
  const activeCustomers = customers.filter((c) => !c.isDeleted);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  return activeCustomers.map((customer) => {
    // Orders are kept for reference but balance is calculated from shipments
    const customerOrders = orders.filter((o) => o.customerId === customer.id && !o.isDeleted);

    // Get all delivered shipments for this customer
    const customerShipments = shipments.filter((s) => {
      // Find related order to check customerId
      const order = orders.find((o) => o.id === s.orderId);
      return (
        order && order.customerId === customer.id && !s.isDeleted && s.status === 'Teslim Edildi'
      ); // Only delivered shipments create debt
    });

    // All visible payments (not deleted, not cancelled)
    const customerPayments = payments.filter(
      (p) => p.customerId === customer.id && !p.isDeleted && p.status !== 'İptal'
    );

    // Payments that actually reduce debt (Tahsil Edildi OR Check/Promissory Note)
    const effectivePayments = customerPayments.filter((p) => {
      if (p.status === 'İptal') return false;
      if (p.status === 'Tahsil Edildi') return true;
      // Çek ve Senetler alındığı anda bakiyeden düşer
      return p.paymentMethod === 'Çek' || p.paymentMethod === 'Senet';
    });

    // Payments that are pending (not collected, not cancelled) - for overdue check
    const customerPendingPayments = payments.filter(
      (p) =>
        p.customerId === customer.id &&
        !p.isDeleted &&
        p.status !== 'Tahsil Edildi' &&
        p.status !== 'İptal'
    );

    // Calculate total debt from DELIVERED SHIPMENTS
    const totalDebtInTRY = customerShipments.reduce((totalDebt, shipment) => {
      const order = orders.find((o) => o.id === shipment.orderId);
      if (!order || !shipment.items) return totalDebt;

      const shipmentTotal = shipment.items.reduce((shipmentSum, item) => {
        // Find corresponding order item to get price
        // Note: ShipmentItem has orderItemIndex or productId.
        // We match by productId, but strictly speaking orderItemIndex is safer if multiple same products exist.
        // For now, matching by productId is the standard in this app.
        const orderItem = order.items.find((oi) => oi.productId === item.productId);
        if (!orderItem) return shipmentSum;

        const price = orderItem.unit_price || 0;
        const quantity = item.quantity || 0;
        // Add VAT
        const lineTotal = price * quantity;
        const lineTotalWithVAT = lineTotal * (1 + (order.vatRate || 0) / 100);

        return shipmentSum + lineTotalWithVAT;
      }, 0);

      return totalDebt + convertToTRY(shipmentTotal, order.currency || 'TRY');
    }, 0);

    // Use Shipments as "Order Details" in the balance view (since they are the source of debt)
    const orderDetails = customerShipments.map((s) => {
      const order = orders.find((o) => o.id === s.orderId);

      // Calculate specific shipment amount
      let shipmentAmount = 0;
      if (order && s.items) {
        shipmentAmount = s.items.reduce((sum, item) => {
          const orderItem = order.items.find((oi) => oi.productId === item.productId);
          if (!orderItem) return sum;
          const lineTotal = (orderItem.unit_price || 0) * (item.quantity || 0);
          return sum + lineTotal * (1 + (order.vatRate || 0) / 100);
        }, 0);
      }

      return {
        id: s.id,
        date: s.shipment_date, // Debt date is shipment date
        amount: shipmentAmount,
        currency: order?.currency || 'TRY',
        orderNumber: s.trackingNumber || order?.orderNumber || 'Bilinmiyor', // Show shipment/tracking no
        status: s.status,
        type: 'Sevkiyat', // Mark as shipment
      };
    });

    const paymentDetails = customerPayments.map((p) => ({
      id: p.id,
      date: p.paidDate || p.dueDate,
      amount: p.amount || 0,
      currency: p.currency || 'TRY',
      method: p.paymentMethod || 'Belirtilmemiş',
      status: p.status,
    }));

    // Calculate due date info
    const overduePayments = customerPendingPayments.filter((p) => {
      if (!p.dueDate) return false;
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    const upcomingPayments = customerPendingPayments.filter((p) => {
      if (!p.dueDate) return false;
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate <= sevenDaysLater;
    });

    // Calculate total payments using only EFFECTIVE (collected) payments
    const totalPaymentsInTRY = effectivePayments.reduce((sum, payment) => {
      return sum + convertToTRY(payment.amount || 0, payment.currency || 'TRY');
    }, 0);

    // Get all approved returns for this customer
    const customerReturns = returns.filter(
      (r) => r.customerId === customer.id && !r.isDeleted && r.status === 'Onaylandı'
    );

    // Calculate total returns amount
    const totalReturnsInTRY = customerReturns.reduce((sum, r) => {
      // Assuming returns are in TRY for simplicity, or we check currency if available on return
      // The ReturnInvoice type doesn't have currency field explicitly in my definition above,
      // but let's assume it inherits context or we added it.
      // For now, let's treat it as base currency or check if we need to add currency to ReturnInvoice.
      // I'll assume TRY or match order currency logic if possible.
      // Let's rely on the fact that for now most are TRY.
      return sum + (r.totalAmount || 0);
    }, 0);

    const balanceAmount = totalPaymentsInTRY + totalReturnsInTRY - totalDebtInTRY;

    let status: BalanceStatus;
    let statusText: string;
    let icon: string;
    let color: string;

    if (Math.abs(balanceAmount) < 100) {
      status = 'dengede';
      statusText = 'Hesap Dengede';
      color = 'text-gray-600 dark:text-gray-400';
      icon = '⚖️';
    } else if (balanceAmount > 0) {
      status = 'alacak';
      statusText = 'Alacak Var';
      color = 'text-green-600 dark:text-green-400';
      icon = '💰';
    } else {
      status = 'borc';
      statusText = 'Borç Var';
      color = 'text-red-600 dark:text-red-400';
      icon = '⚠️';
    }

    // Calculate risk analysis
    const overdueCount = overduePayments.length;
    const averageDelayDays =
      overdueCount > 0
        ? overduePayments.reduce((sum, p) => {
            const dueDate = new Date(p.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const delayDays = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + delayDays;
          }, 0) / overdueCount
        : 0;

    const totalOverdueAmountInTRY = overduePayments.reduce((sum, p) => {
      return sum + convertToTRY(p.amount || 0, p.currency || 'TRY');
    }, 0);

    const totalUpcomingAmountInTRY = upcomingPayments.reduce((sum, p) => {
      return sum + convertToTRY(p.amount || 0, p.currency || 'TRY');
    }, 0);

    const overdueRatio = totalDebtInTRY > 0 ? (totalOverdueAmountInTRY / totalDebtInTRY) * 100 : 0;
    const balanceRatio = totalDebtInTRY > 0 ? (Math.abs(balanceAmount) / totalDebtInTRY) * 100 : 0;

    // Calculate risk score (0-100)
    let riskScore = 0;

    // Factor 1: Overdue count (max 30 points)
    riskScore += Math.min(overdueCount * 10, 30);

    // Factor 2: Average delay days (max 30 points)
    riskScore += Math.min(averageDelayDays * 2, 30);

    // Factor 3: Overdue ratio (max 25 points)
    riskScore += Math.min(overdueRatio * 0.25, 25);

    // Factor 4: Balance ratio - only if in debt (max 15 points)
    if (balanceAmount < 0) {
      riskScore += Math.min(balanceRatio * 0.15, 15);
    }

    riskScore = Math.min(Math.round(riskScore), 100);

    let riskLevel: RiskLevel;
    let riskLabel: string;
    let riskColor: string;

    if (riskScore <= 30) {
      riskLevel = 'low';
      riskLabel = 'Düşük Risk';
      riskColor = 'text-green-600 dark:text-green-400';
    } else if (riskScore <= 60) {
      riskLevel = 'medium';
      riskLabel = 'Orta Risk';
      riskColor = 'text-yellow-600 dark:text-yellow-400';
    } else {
      riskLevel = 'high';
      riskLabel = 'Yüksek Risk';
      riskColor = 'text-red-600 dark:text-red-400';
    }

    return {
      customer,
      totalOrders: totalDebtInTRY, // Actually Total Debt from Shipments now
      totalPayments: totalPaymentsInTRY,
      balance: balanceAmount,
      status,
      statusText,
      icon,
      color,
      orderDetails, // Contains Shipments now
      paymentDetails,
      dueDateInfo: {
        overduePayments,
        upcomingPayments,
        totalOverdueAmount: totalOverdueAmountInTRY,
        totalUpcomingAmount: totalUpcomingAmountInTRY,
      },
      riskAnalysis: {
        riskScore,
        riskLevel,
        riskLabel,
        riskColor,
        factors: {
          overdueCount,
          averageDelayDays: Math.round(averageDelayDays * 10) / 10, // 1 decimal
          overdueRatio: Math.round(overdueRatio * 10) / 10,
          balanceRatio: Math.round(balanceRatio * 10) / 10,
        },
      },
    };
  });
};

/**
 * Calculates summary statistics for balances.
 */
export const calculateBalancesSummary = (customerBalances: CustomerBalance[]): BalancesSummary => {
  const totalAlacak = customerBalances
    .filter((cb) => cb.status === 'alacak')
    .reduce((sum, cb) => sum + cb.balance, 0);

  const totalBorc = customerBalances
    .filter((cb) => cb.status === 'borc')
    .reduce((sum, cb) => sum + Math.abs(cb.balance), 0);

  const netBalance = customerBalances.reduce((sum, cb) => sum + cb.balance, 0);

  const dengedeCount = customerBalances.filter((cb) => cb.status === 'dengede').length;

  // Calculate total overdue and upcoming
  const totalOverdue = customerBalances.reduce(
    (sum, cb) => sum + cb.dueDateInfo.totalOverdueAmount,
    0
  );
  const totalUpcoming = customerBalances.reduce(
    (sum, cb) => sum + cb.dueDateInfo.totalUpcomingAmount,
    0
  );
  const overdueCount = customerBalances.filter(
    (cb) => cb.dueDateInfo.overduePayments.length > 0
  ).length;
  const upcomingCount = customerBalances.filter(
    (cb) => cb.dueDateInfo.upcomingPayments.length > 0
  ).length;

  // Calculate risk statistics
  const highRiskCount = customerBalances.filter(
    (cb) => cb.riskAnalysis.riskLevel === 'high'
  ).length;
  const mediumRiskCount = customerBalances.filter(
    (cb) => cb.riskAnalysis.riskLevel === 'medium'
  ).length;
  const lowRiskCount = customerBalances.filter((cb) => cb.riskAnalysis.riskLevel === 'low').length;

  return {
    totalAlacak,
    totalBorc,
    netBalance,
    dengedeCount,
    totalOverdue,
    totalUpcoming,
    overdueCount,
    upcomingCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
  };
};

/**
 * Extracts unique cities from customers list.
 */
export const getUniqueCitiesFromCustomers = (customers: Customer[]): string[] => {
  const uniqueCities = new Set(customers.filter((c) => c.city).map((c) => c.city));
  return ['Tümü', ...Array.from(uniqueCities).sort()];
};
