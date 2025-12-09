/**
 * Type Definitions for Takip CRM
 *
 * Bu dosya tüm veri modellerini içerir.
 */

// Temel tipler
export type Timestamp = string; // ISO 8601 format
export type Currency = 'TRY' | 'USD' | 'EUR';
export type VATRate = 0 | 1 | 10 | 20;

// Kullanıcı Rolleri
export type UserRole = 'admin' | 'user';

// Durum tipleri
export type OrderStatus = 'Taslak' | 'Bekliyor' | 'Hazırlanıyor' | 'Tamamlandı' | 'İptal Edildi';
export type QuoteStatus = 'Taslak' | 'Hazırlandı' | 'Onaylandı' | 'Reddedildi';
export type MeetingOutcome = 'İlgileniyor' | 'İlgilenmiyor' | 'Teklif Bekliyor';
export type ShipmentStatus =
  | 'Hazırlanıyor'
  | 'Gönderildi'
  | 'Yolda'
  | 'Teslim Edildi'
  | 'İptal Edildi';
export type PaymentStatus = 'Bekliyor' | 'Tahsil Edildi' | 'Gecikti' | 'İptal';
export type PaymentMethod =
  | 'Nakit'
  | 'Havale/EFT'
  | 'Kredi Kartı'
  | 'Çek'
  | 'Senet'
  | 'Belirtilmemiş';
export type CheckStatus =
  | 'Portföyde'
  | 'Bankaya Verildi'
  | 'Tahsil Edildi'
  | 'Ciro Edildi'
  | 'Karşılıksız'
  | 'İade Edildi';

// İptal nedenleri
export type CancellationReason =
  | 'Müşteri Talebi'
  | 'Stok Yetersizliği'
  | 'Fiyat Anlaşmazlığı'
  | 'Teslimat Süresi'
  | 'Ödeme Sorunu'
  | 'Diğer';

// Purchasing Module Types

export type PurchaseStatus =
  | 'Talep Edildi'
  | 'Araştırılıyor'
  | 'Sipariş Verildi'
  | 'Depoya Girdi'
  | 'İptal Edildi';

export interface SupplierOffer {
  id: string;
  supplierName: string;
  price: number;
  currency: Currency;
  deliveryTime?: string; // Termin süresi (örn: 3 gün)
  isApproved: boolean;
  notes?: string;
  createdAt: Timestamp;
}

export interface Supplier {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface PurchaseRequest {
  id: string;
  purchaseNumber: string; // SAT-2024-001

  // Product Info
  productId: string;
  productName: string; // Denormalized
  quantity: number;
  unit: string;
  targetPrice?: number; // Hedef fiyat
  currency: Currency;

  // Request Info
  requestDate: string; // YYYY-MM-DD
  requestedBy: string; // User ID
  requestedByEmail: string; // Email
  department?: string; // Departman (opsiyonel)
  priority: 'Düşük' | 'Orta' | 'Yüksek' | 'Acil';

  // Relations (CRM Integration)
  customerId?: string; // Hangi müşteri için?
  customerName?: string; // Denormalized müşteri adı
  meetingId?: string; // Hangi görüşmeden doğdu?
  salesRepId?: string; // İlgili satış temsilcisi

  // Status & Workflow
  status: PurchaseStatus;

  // Supplier Info (Optional until ordering)
  supplierId?: string;
  supplierName?: string; // Denormalized "Ahmet Ticaret"
  offers?: SupplierOffer[]; // Toplanan teklifler

  // Order Info (When ordered)
  orderDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Financials
  unitPrice?: number; // Final agreed price
  totalAmount?: number;

  // Notes
  description?: string; // Talep açıklaması
  notes?: string; // Süreç notları

  // Metadata
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
}

// User Interface
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  isActive?: boolean; // Kullanıcı aktif mi?
  lastLogin?: Timestamp; // Son giriş zamanı
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isInitialAdmin?: boolean;
}

// Login Log Interface
export interface LoginLog {
  id: string;
  userId: string;
  email: string;
  action: 'login' | 'logout';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

// Customer Interface
export interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  taxOffice?: string; // Vergi Dairesi
  taxNumber?: string; // Vergi No
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Product Interface
export interface Product {
  id: string;
  name: string;
  code?: string; // Product code
  cost_price: number;
  selling_price: number;
  unit: string;
  description?: string;
  currency?: Currency;

  // Category system (optional - backward compatible)
  category?: string; // Main category (Galvaniz, DKP, Siyah, Boyalı, Baklavalı Sac, HRP)
  subcategory?: string; // @deprecated No longer used - kept for backward compatibility with existing data
  tags?: string[]; // @deprecated No longer used - kept for backward compatibility with existing data

  // Stock management (optional - backward compatible)
  stock_quantity?: number; // Current stock quantity
  minimum_stock?: number; // Minimum stock level for warnings
  track_stock?: boolean; // Enable stock tracking for this product

  // Hybrid Costing System (optional - backward compatible)
  costingMethod?: CostingMethod; // Default method: 'fifo' | 'lifo' | 'average' | 'manual'
  allowManualLotSelection?: boolean; // Allow manual lot selection during sales
  requireLotApproval?: boolean; // Require approval for FIFO violations
  lotTrackingEnabled?: boolean; // Enable lot tracking for this product

  // Weighted Average (for average method)
  averageCost?: number; // Weighted average cost
  totalStockValue?: number; // Total stock value

  // Cost History
  costHistory?: CostHistoryEntry[]; // Last 12 months cost history

  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Order Item Interface
export interface OrderItem {
  productId: string;
  productName?: string; // Denormalized for display
  quantity: number;
  unit_price: number;
  unit?: string;
  total?: number;

  // HYBRID COSTING SYSTEM - Dual Cost Tracking

  // ACCOUNTING COST (FIFO-based)
  accountingCost?: number; // FIFO total cost: 7,000 TL
  accountingCostPerUnit?: number; // FIFO unit cost: 35 TL/kg
  accountingLotConsumptions?: LotConsumption[]; // Lots according to FIFO

  // PHYSICAL COST (Actual)
  physicalCost?: number; // Actual cost: 7,200 TL
  physicalCostPerUnit?: number; // Actual unit cost: 36 TL/kg
  physicalLotConsumptions?: LotConsumption[]; // Actual lots used

  // VARIANCE ANALYSIS
  costVariance?: number; // Variance: 200 TL (physical - accounting)
  costVariancePercentage?: number; // Variance %: 2.86%
  varianceReason?: string; // "Manual lot selection - LIFO used"
  hasCostVariance?: boolean; // FIFO violation?

  // LOT SELECTION METHOD
  lotSelectionMethod?: LotSelectionMethod; // 'auto-fifo' | 'auto-lifo' | 'manual' | 'average'
  manualLotSelectionApprovedBy?: string; // Approver

  // USER NOTES
  costingNotes?: string; // "Picked from front of warehouse"
}

// Quote Interface
export interface Quote {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized
  items: OrderItem[];
  subtotal: number;
  vatRate: VATRate;
  vatAmount: number;
  total_amount: number;
  currency?: Currency;
  teklif_tarihi: string; // YYYY-MM-DD
  valid_until?: string;
  gecerlilik_tarihi?: string; // Legacy field support
  status: QuoteStatus;
  rejectionReasonId?: string; // Standard rejection reason ID
  rejection_reason?: string; // Reason for rejection (Free text)
  targetPrice?: number; // Customer's target price (for Price Gap analysis)
  competitorName?: string; // Competitor name (for Competitor Intel)
  reminderDate?: string; // Win-back reminder date
  quoteNumber?: string; // Friendly quote number (TEK-2024-001)
  paymentType?: 'Peşin' | 'Vadeli';
  paymentTerm?: number; // Days for vadeli
  notes?: string;
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  orderId?: string; // If converted to order
}

// Order Interface
export interface Order {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized
  items: OrderItem[];
  subtotal: number;
  vatRate: VATRate;
  vatAmount: number;
  total_amount: number;
  currency?: Currency;
  order_date: string; // YYYY-MM-DD
  delivery_date?: string;
  status: OrderStatus;
  paymentType?: 'Peşin' | 'Vadeli' | 'Çek';
  paymentTerm?: number; // Days for vadeli
  checkBank?: string; // Banka adı (çek için)
  checkNumber?: string; // Çek numarası (çek için)
  checkDate?: string; // Çek vadesi (YYYY-MM-DD)
  notes?: string;
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  quoteId?: string; // If created from quote
  orderNumber?: string; // Sipariş numarası

  // Cancellation fields
  cancelledAt?: Timestamp; // İptal tarihi
  cancelledBy?: string; // User ID who cancelled
  cancelledByEmail?: string; // Email of canceller
  cancellationReason?: CancellationReason; // İptal nedeni
  cancellationNotes?: string; // İptal açıklaması
}

// Inquired Product Interface (Products asked about during meetings)
export interface InquiredProduct {
  id: string; // Unique ID for this inquiry
  productId: string;
  productName: string; // Denormalized
  quantity?: number;
  unit?: string; // "Kg", "Adet", "Metre", etc.
  priority?: 'Düşük' | 'Orta' | 'Yüksek'; // Interest level (optional)
  notes?: string; // Specific notes about this product inquiry
  priceQuoted?: number; // If a verbal price was given
  createPurchaseRequest?: boolean; // Create a purchase request for this item automatically
}

// Meeting Interface
export interface Meeting {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized
  meeting_date: string; // YYYY-MM-DD
  meeting_time?: string; // HH:MM
  meetingType?: string; // İlk Temas, Teklif Sunumu, Takip Görüşmesi, etc.
  meeting_type?: string; // Legacy field support
  outcome?: MeetingOutcome;
  notes?: string;
  next_action_date?: string;
  next_action_type?: string; // Eylem Tipi (Arama, Ziyaret vb.)
  next_action_notes?: string;
  status?: string;
  inquiredProducts?: InquiredProduct[]; // Products customer asked about
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Shipment Item Interface
export interface ShipmentItem {
  productId: string;
  productName?: string;
  quantity: number;
  unit?: string;
  orderItemIndex: number; // Index of the order item this shipment item relates to
}

// Shipment Interface
export interface Shipment {
  id: string;
  orderId: string;
  orderNumber?: string; // Denormalized
  customerId?: string;
  customerName?: string; // Denormalized
  shipment_date: string; // YYYY-MM-DD
  delivery_date?: string;
  status: ShipmentStatus;
  carrier?: string;
  tracking_number?: string;
  trackingNumber?: string; // Alias for camelCase compatibility
  notes?: string;
  items?: ShipmentItem[]; // Items included in this shipment
  // Invoice tracking
  isInvoiced?: boolean; // Fatura kesildi mi?
  invoicedAt?: Timestamp; // Fatura kesim tarihi
  invoiceNotes?: string; // Fatura notu
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Activity Log Interface
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

// Export/Import Types
export interface ExportOptions {
  filename?: string;
  includeDeleted?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

// Excel Column Mapping
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'email' | 'phone';
  validate?: (value: any) => boolean | string;
}

// Custom Task Interface (for manual tasks on dashboard)
export interface CustomTask {
  id: string;
  userId: string; // Same as createdBy for consistency
  createdByEmail?: string; // Email of creator (for display)
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  completed: boolean;
  completedAt?: Timestamp;
  priority?: 'low' | 'medium' | 'high';
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Stock Movement Types
export type StockMovementType =
  | 'Manuel Giriş' // Manual stock addition
  | 'Sevkiyat' // Order shipment (decrease)
  | 'İptal İadesi' // Cancelled order return (increase)
  | 'Sayım Düzeltmesi' // Physical count adjustment
  | 'Fire/Kayıp' // Damage/loss (decrease)
  | 'Müşteri İadesi' // Customer return (increase)
  | 'Transfer'; // Warehouse transfer

// Stock Movement Interface (for tracking all stock changes)
export interface StockMovement {
  id: string;
  productId: string;
  productName: string; // Denormalized for easy display
  productUnit: string; // Denormalized unit

  type: StockMovementType;
  quantity: number; // Positive or negative value
  previousStock: number; // Stock before this movement
  newStock: number; // Stock after this movement

  // Relations
  relatedId?: string; // orderId, shipmentId, etc.
  relatedType?: string; // 'order', 'shipment', 'manual', etc.
  relatedReference?: string; // Order number, shipment number, etc.

  notes?: string;
  createdBy: string; // User ID
  createdByEmail: string; // User email
  createdAt: Timestamp;
}

// Check/Promissory Note Endorsement Interface
export interface CheckEndorsement {
  id: string;
  date: string; // YYYY-MM-DD
  endorsedTo: string; // Firma adı
  endorsedBy: string; // Personel email
  notes?: string;
}

// Check/Promissory Note Status History Interface
export interface CheckStatusHistory {
  date: string; // ISO timestamp
  status: CheckStatus;
  changedBy: string; // User email
  notes?: string;
}

// Check Tracking Interface (for detailed check/promissory note tracking)
export interface CheckTracking {
  // Temel Bilgiler
  checkNumber: string;
  bank: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;

  // Durum
  status: CheckStatus;

  // Banka İşlemleri
  bankSubmissionDate?: string; // Bankaya verilme tarihi
  bankBranch?: string; // Şube adı
  submittedBy?: string; // Bankaya teslim eden personel

  // Tahsilat
  collectionDate?: string; // Tahsil edilme tarihi

  // Ciro Bilgileri
  endorsements: CheckEndorsement[];

  // Karşılıksız
  bouncedDate?: string; // Karşılıksız dönüş tarihi
  bouncedReason?: string; // Karşılıksız nedeni

  // İade
  returnedDate?: string; // İade tarihi
  returnedReason?: string; // İade nedeni

  // Durum Geçmişi
  statusHistory: CheckStatusHistory[];

  // Notlar
  notes?: string;
}

// Payment Interface (for payment tracking)
export interface Payment {
  id: string;

  // İlişkiler
  orderId?: string; // Hangi siparişe ait
  orderNumber?: string; // Denormalized
  customerId: string; // Müşteri
  customerName?: string; // Denormalized

  // Ödeme Bilgileri
  amount: number; // Ödeme tutarı
  currency?: Currency;
  paymentMethod: PaymentMethod;

  // Vade ve Tarih Bilgileri
  dueDate: string; // Vade tarihi (YYYY-MM-DD)

  // Çek/Senet Bilgileri
  checkNumber?: string; // Çek/Senet numarası
  checkBank?: string; // Banka adı

  // Durum
  status: PaymentStatus;
  paidDate?: string; // Tahsil tarihi (YYYY-MM-DD)

  // Notlar
  notes?: string;

  // Kısmi Ödeme (Partial Payment) Tracking
  relatedPaymentId?: string; // Bölünmüş ödeme ise ilişkili ödeme ID'si
  originalAmount?: number; // Orijinal beklenen tutar (split payment için)
  splitReason?: string; // Neden bölündü (örn: "Kısmi tahsilat")

  // Çek Takip (Opsiyonel - sadece çek/senet ödemeleri için)
  checkTracking?: CheckTracking;

  // Metadata
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Payment Analytics Interface (for customer payment summary)
export interface PaymentAnalytics {
  totalDebt: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;

  onTimePaymentRate: number; // 0-100
  avgDelayDays: number;
  riskScore: number; // 0-10
  riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK';

  paymentMethodDistribution: Record<string, number>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
  timeline: Array<{
    date: string;
    amount: number;
    status: PaymentStatus;
    delayDays: number | null;
    paymentMethod: PaymentMethod;
  }>;
}

// Stock Count Item Interface (individual product count in a session)
export interface StockCountItem {
  productId: string;
  productName: string; // Denormalized
  productUnit: string; // Denormalized
  systemStock: number; // Stock in system at count time
  physicalCount: number | null; // Actual counted quantity
  variance: number; // Difference (physicalCount - systemStock)
  variancePercentage: number; // (variance / systemStock) * 100
  notes?: string; // Notes for this specific product
}

// Stock Count Session Interface (full inventory count session)
export interface StockCountSession {
  id: string;
  countDate: string; // YYYY-MM-DD
  startedAt: Timestamp; // When count started
  completedAt?: Timestamp; // When count was completed
  status: 'in_progress' | 'completed' | 'cancelled'; // Count status

  items: StockCountItem[]; // All products in this count

  totalProducts: number; // Total products counted
  productsWithVariance: number; // Products with discrepancies
  totalVarianceValue: number; // Total value of variances (in currency)

  appliedAt?: Timestamp; // When adjustments were applied to stock
  appliedBy?: string; // User ID who applied adjustments
  appliedByEmail?: string; // Email of applier

  notes?: string; // General notes for this count session
  createdBy: string; // User ID who created this count
  createdByEmail: string; // Email of creator
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================================
// HYBRID COSTING SYSTEM - LOT TRACKING & COST MANAGEMENT
// ============================================================================

// Costing Methods
export type CostingMethod = 'fifo' | 'lifo' | 'average' | 'manual';
export type LotSelectionMethod = 'auto-fifo' | 'auto-lifo' | 'manual' | 'average';
export type LotStatus = 'active' | 'consumed' | 'expired' | 'returned';
export type ConsumptionType = 'fifo' | 'lifo' | 'manual' | 'average';
export type ReconciliationStatus = 'pending' | 'approved' | 'adjusted' | 'rejected';
export type AdjustmentType = 'accounting-to-physical' | 'physical-to-accounting';

// Stock Lot Interface (Physical Stock - LOT Based)
export interface StockLot {
  // Basic Information
  id: string;
  productId: string;
  productName: string; // Denormalized
  productUnit: string; // Denormalized

  // Lot Information
  lotNumber: string; // "LOT-2024-11-22-001"
  purchaseDate: string; // "2024-11-22" (YYYY-MM-DD)
  purchaseReference?: string; // "FT-2024-1234" (Invoice number)
  supplierName?: string; // "ABC Çelik Ltd."
  invoiceNumber?: string; // "FT-001"

  // Quantity Information
  initialQuantity: number; // Initial: 500 kg
  remainingQuantity: number; // Remaining: 350 kg
  consumedQuantity: number; // Used: 150 kg

  // Cost Information
  unitCost: number; // Unit cost: 35.50 TL/kg
  totalCost: number; // Total: 17,750 TL
  currency: Currency; // 'TRY' | 'USD' | 'EUR'
  exchangeRate?: number; // Exchange rate (for USD/EUR)

  // Quality & Location (Optional)
  batchNumber?: string; // Manufacturer batch number
  expiryDate?: string; // Expiry date (for food products)
  qualityGrade?: string; // "A", "B", "C" quality class
  warehouseLocation?: string; // "Warehouse-A / Shelf-12"

  // Status
  status: LotStatus;
  isConsumed: boolean; // Fully consumed?
  consumedAt?: string; // Consumption date

  // Notes
  notes?: string;

  // Metadata
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Lot Consumption Interface (Lot Usage Record)
export interface LotConsumption {
  id: string;
  lotId: string;
  lotNumber: string; // Denormalized

  // Related Records
  orderId: string;
  orderNumber?: string;
  shipmentId?: string;

  // Consumption Information
  quantityUsed: number; // Used from this lot: 150 kg
  unitCost: number; // Cost at that time: 35.50
  totalCost: number; // Total cost: 5,325 TL

  // Consumption Type
  consumptionType: ConsumptionType;

  // Date
  consumptionDate: string; // "2024-11-25"

  // Metadata
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
}

// Cost History Entry Interface
export interface CostHistoryEntry {
  date: string; // "2024-11-01"
  averageCost: number; // Average at that time: 35.25
  stockQuantity: number; // Stock at that time: 850
  method: CostingMethod;
  reason: 'purchase' | 'sale' | 'adjustment' | 'reconciliation';
  notes?: string;
}

// Lot Reconciliation Interface (Monthly reconciliation)
export interface LotReconciliation {
  id: string;

  // Period
  period: string; // "2024-11" (YYYY-MM)
  periodStart: string; // "2024-11-01"
  periodEnd: string; // "2024-11-30"

  // Product
  productId: string;
  productName: string; // Denormalized

  // LOT Information
  lotId: string;
  lotNumber: string;

  // VARIANCES
  accountingBalance: number; // Accounting stock: 300 kg
  physicalBalance: number; // Physical stock: 500 kg
  variance: number; // Variance: +200 kg
  varianceValue: number; // Value variance: +7,000 TL

  // STATUS
  status: ReconciliationStatus;
  adjustmentNeeded: boolean;

  // ADJUSTMENT
  adjustmentType?: AdjustmentType;
  adjustmentDate?: string;
  adjustedBy?: string;
  adjustedByEmail?: string;
  adjustmentNotes?: string;

  // APPROVAL
  approvedBy?: string;
  approvedByEmail?: string;
  approvedAt?: string;

  // Metadata
  createdBy: string;
  createdByEmail: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
