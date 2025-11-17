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
export type OrderStatus = 'Bekliyor' | 'Hazırlanıyor' | 'Tamamlandı';
export type QuoteStatus = 'Hazırlandı' | 'Onaylandı' | 'Reddedildi';
export type MeetingOutcome = 'İlgileniyor' | 'İlgilenmiyor' | 'Teklif Bekliyor';
export type ShipmentStatus = 'Hazırlanıyor' | 'Gönderildi' | 'Yolda' | 'Teslim Edildi';
export type PaymentStatus = 'Bekliyor' | 'Tahsil Edildi' | 'Gecikti' | 'İptal';
export type PaymentMethod = 'Nakit' | 'Havale/EFT' | 'Kredi Kartı' | 'Çek' | 'Senet' | 'Belirtilmemiş';

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
  cost_price: number;
  selling_price: number;
  unit: string;
  description?: string;
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
  status: QuoteStatus;
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
}

// Meeting Interface
export interface Meeting {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized
  meeting_date: string; // YYYY-MM-DD
  meeting_time?: string; // HH:MM
  meetingType?: string; // İlk Temas, Teklif Sunumu, Takip Görüşmesi, etc.
  outcome?: MeetingOutcome;
  notes?: string;
  next_action_date?: string;
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
  notes?: string;
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

  // Metadata
  createdBy?: string; // User ID who created this
  createdByEmail?: string; // Email of creator (for display)
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
