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

// User Interface
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isInitialAdmin?: boolean;
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
  paymentType?: 'Peşin' | 'Vadeli';
  paymentTerm?: number; // Days for vadeli
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  quoteId?: string; // If created from quote
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
  outcome?: MeetingOutcome;
  notes?: string;
  next_action_date?: string;
  next_action_notes?: string;
  status?: string;
  inquiredProducts?: InquiredProduct[]; // Products customer asked about
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
