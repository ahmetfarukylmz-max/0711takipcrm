import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { PurchaseRequest, PurchaseStatus, SupplierOffer, Product } from '../../types';
import { useFirestoreCollections } from '../../hooks/useFirestore';
import { saveDocument, deleteDocument } from '../../services/firestoreService';
import { createQuoteFromPurchaseHandler } from '../../utils/dataHandlers';
import useStore from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid'; // We might need this for local IDs if not using firestore auto ID immediately

// --- CONSTANTS ---
const COLUMNS: { id: PurchaseStatus; title: string; color: string; icon: string }[] = [
  { id: 'Talep Edildi', title: 'Talep Edildi', color: 'bg-gray-100 border-gray-200', icon: '📋' },
  { id: 'Araştırılıyor', title: 'Araştırılıyor', color: 'bg-blue-50 border-blue-200', icon: '🔍' },
  {
    id: 'Sipariş Verildi',
    title: 'Sipariş Verildi',
    color: 'bg-purple-50 border-purple-200',
    icon: '🚚',
  },
  { id: 'Depoya Girdi', title: 'Depoya Girdi', color: 'bg-green-50 border-green-200', icon: '✅' },
];

const PRIORITY_COLORS = {
  Düşük: 'bg-gray-100 text-gray-800',
  Orta: 'bg-yellow-100 text-yellow-800',
  Yüksek: 'bg-orange-100 text-orange-800',
  Acil: 'bg-red-100 text-red-800',
};

// --- COMPONENTS ---

// 1. Kanban Card Component
const PurchaseCard = ({
  request,
  isOverlay = false,
  onClick,
}: {
  request: PurchaseRequest;
  isOverlay?: boolean;
  onClick?: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
    data: {
      type: 'Request',
      request,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border-2 border-blue-500 opacity-50 h-[150px]"
      />
    );
  }

  const initials = request.requestedByEmail
    ? request.requestedByEmail.split('@')[0].substring(0, 2).toUpperCase()
    : '??';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${isOverlay ? 'shadow-xl scale-105 rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
          #{request.purchaseNumber || request.id.slice(0, 4)}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${PRIORITY_COLORS[request.priority]}`}
        >
          {request.priority}
        </span>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm line-clamp-2">
        {request.productName}
      </h4>

      {/* Customer Info */}
      {request.customerName && (
        <div className="mb-2 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded w-fit">
          <span>🏢</span>
          <span className="truncate max-w-[150px] font-medium">{request.customerName}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {request.quantity} {request.unit}
        </div>
        <div
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-gray-800"
          title={request.requestedByEmail}
        >
          {initials}
        </div>
      </div>

      {/* Supplier / Offer Info */}
      {request.offers && request.offers.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <span>🏷️</span>
          <span>{request.offers.length} Teklif</span>
          {request.supplierName && <span className="text-gray-400 px-1">•</span>}
          {request.supplierName && (
            <span className="truncate max-w-[80px]">{request.supplierName}</span>
          )}
        </div>
      )}
    </div>
  );
};

// 2. Kanban Column Component
const KanbanColumn = ({
  column,
  requests,
  onCardClick,
}: {
  column: (typeof COLUMNS)[0];
  requests: PurchaseRequest[];
  onCardClick: (request: PurchaseRequest) => void;
}) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full min-w-[300px] w-[300px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
          <span>{column.icon}</span>
          {column.title}
        </h3>
        <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600">
          {requests.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
        <SortableContext items={requests.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {requests.map((request) => (
            <PurchaseCard key={request.id} request={request} onClick={() => onCardClick(request)} />
          ))}
        </SortableContext>
        {requests.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-xs">
            Boş
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Modals

// New Request Modal
const NewRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PurchaseRequest>) => void;
}) => {
  const { collections } = useStore();
  const products = collections.products || [];
  const customers = collections.customers || []; // Get customers
  const [formData, setFormData] = useState<Partial<PurchaseRequest>>({
    priority: 'Orta',
    quantity: 1,
    unit: 'Adet',
    currency: 'TRY',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>➕</span> Yeni Satınalma Talebi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Müşteri Seçimi (Opsiyonel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İlgili Müşteri (Opsiyonel)
            </label>
            <input
              list="customers-list"
              type="text"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Müşteri ara..."
              value={formData.customerName || ''}
              onChange={(e) => {
                const val = e.target.value;
                const existingCustomer = customers.find((c) => c.name === val);
                setFormData({
                  ...formData,
                  customerName: val,
                  customerId: existingCustomer?.id,
                });
              }}
            />
            <datalist id="customers-list">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ürün / Hizmet
            </label>
            <input
              list="products-list"
              type="text"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ürün adı yazın veya seçin..."
              value={formData.productName || ''}
              onChange={(e) => {
                const val = e.target.value;
                const existingProduct = products.find((p) => p.name === val);
                setFormData({
                  ...formData,
                  productName: val,
                  productId: existingProduct?.id || 'manual-' + Date.now(),
                  unit: existingProduct?.unit || formData.unit,
                });
              }}
            />
            <datalist id="products-list">
              {products.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miktar
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Birim
              </label>
              <select
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option>Adet</option>
                <option>Kg</option>
                <option>Metre</option>
                <option>Litre</option>
                <option>Koli</option>
                <option>Set</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aciliyet
            </label>
            <div className="flex gap-2">
              {['Düşük', 'Orta', 'Yüksek', 'Acil'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p as any })}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    formData.priority === p
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notlar (Opsiyonel)
            </label>
            <textarea
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              rows={3}
              placeholder="Marka tercihi, teslimat detayları vb."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={() => onSubmit(formData)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            disabled={!formData.productName}
          >
            Talebi Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

// Request Detail Modal
const RequestDetailModal = ({
  request,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: {
  request: PurchaseRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<PurchaseRequest>) => void;
  onDelete: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'offers'>('info');
  const [newOffer, setNewOffer] = useState<Partial<SupplierOffer>>({
    currency: 'TRY',
    price: 0,
    isApproved: false,
  });

  // Store access for quote creation
  const setPrefilledQuote = useStore((state) => state.setPrefilledQuote);
  const setActivePage = useStore((state) => state.setActivePage);
  const navigate = React.useMemo(() => (page: string) => setActivePage(page), [setActivePage]);

  if (!isOpen || !request) return null;

  const handleCreateQuote = () => {
    createQuoteFromPurchaseHandler(request, setPrefilledQuote, navigate);
    onClose(); // Close modal after navigation
  };

  const handleAddOffer = () => {
    if (!newOffer.supplierName || !newOffer.price) return;

    const offer: SupplierOffer = {
      id: uuidv4(),
      supplierName: newOffer.supplierName,
      price: Number(newOffer.price),
      currency: newOffer.currency as any,
      isApproved: false,
      notes: newOffer.notes,
      deliveryTime: newOffer.deliveryTime,
      createdAt: new Date().toISOString(),
    };

    const updatedOffers = [...(request.offers || []), offer];
    onUpdate(request.id, { offers: updatedOffers });
    setNewOffer({ currency: 'TRY', price: 0, isApproved: false, supplierName: '' });
    toast.success('Teklif eklendi');
  };

  const handleApproveOffer = (offerId: string) => {
    const updatedOffers = request.offers?.map((o) => ({
      ...o,
      isApproved: o.id === offerId, // Only one approved at a time usually
    }));

    const approvedOffer = request.offers?.find((o) => o.id === offerId);

    onUpdate(request.id, {
      offers: updatedOffers,
      supplierName: approvedOffer?.supplierName,
      unitPrice: approvedOffer?.price,
      currency: approvedOffer?.currency,
      status: 'Araştırılıyor' === request.status ? 'Sipariş Verildi' : request.status, // Auto advance
    });
    toast.success('Teklif onaylandı/seçildi');
  };

  const handleDeleteOffer = (offerId: string) => {
    const updatedOffers = request.offers?.filter((o) => o.id !== offerId);
    onUpdate(request.id, { offers: updatedOffers });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded uppercase ${PRIORITY_COLORS[request.priority]}`}
              >
                {request.priority}
              </span>
              <span className="text-xs text-gray-500 font-mono">#{request.purchaseNumber}</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {request.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {request.productName}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Detaylar
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'offers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Tedarikçi Teklifleri ({request.offers?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/10">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">
                    Miktar
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {request.quantity}{' '}
                    <span className="text-sm font-normal text-blue-700">{request.unit}</span>
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">
                    Talep Eden
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-xs shadow-sm">
                      {request.requestedByEmail?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                      {request.requestedByEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Açıklama / Notlar
                  </label>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 min-h-[100px]">
                    {request.notes || 'Not girilmemiş.'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Süreç Durumu
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                    value={request.status}
                    onChange={(e) =>
                      onUpdate(request.id, { status: e.target.value as PurchaseStatus })
                    }
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-6">
              {/* Offer List */}
              <div className="space-y-3">
                {request.offers?.map((offer) => (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-xl border transition-all ${offer.isApproved ? 'bg-green-50 border-green-200 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-800">
                          {offer.supplierName}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {offer.deliveryTime
                            ? `Termin: ${offer.deliveryTime}`
                            : 'Termin belirtilmedi'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(offer.price, offer.currency)}
                        </p>
                        <p className="text-xs text-gray-500">Birim Fiyat</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      {!offer.isApproved && (
                        <button
                          onClick={() => handleApproveOffer(offer.id)}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium"
                        >
                          ✅ Onayla
                        </button>
                      )}
                      {offer.isApproved && (
                        <span className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold">
                          SEÇİLDİ
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
                {(!request.offers || request.offers.length === 0) && (
                  <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed">
                    Henüz teklif girilmemiş.
                  </div>
                )}
              </div>

              {/* Add Offer Form */}
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Yeni Teklif Ekle
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Tedarikçi Firma"
                    className="rounded-lg border-gray-300 text-sm"
                    value={newOffer.supplierName || ''}
                    onChange={(e) => setNewOffer({ ...newOffer, supplierName: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Fiyat"
                      className="rounded-lg border-gray-300 text-sm flex-1"
                      value={newOffer.price || ''}
                      onChange={(e) => setNewOffer({ ...newOffer, price: Number(e.target.value) })}
                    />
                    <select
                      className="rounded-lg border-gray-300 text-sm w-20"
                      value={newOffer.currency}
                      onChange={(e) =>
                        setNewOffer({ ...newOffer, currency: e.target.value as any })
                      }
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Termin (Örn: 3 Gün)"
                    className="rounded-lg border-gray-300 text-sm flex-1"
                    value={newOffer.deliveryTime || ''}
                    onChange={(e) => setNewOffer({ ...newOffer, deliveryTime: e.target.value })}
                  />
                  <button
                    onClick={handleAddOffer}
                    disabled={!newOffer.supplierName || !newOffer.price}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Bu talebi silmek istediğinize emin misiniz?')) {
                  onDelete(request.id);
                  onClose();
                }
              }}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium"
            >
              🗑️ Talebi Sil
            </button>
            {request.customerId && (
              <button
                onClick={handleCreateQuote}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <span>📄</span> Teklif Oluştur
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg text-sm font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const Purchasing: React.FC = () => {
  const { user } = useAuth();
  useFirestoreCollections(['purchase_requests', 'products']); // Sync collections
  const { collections } = useStore();
  const requests = collections.purchase_requests || [];
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);

  // Auto-collapse sidebar for better view
  React.useEffect(() => {
    setSidebarOpen(false);
    return () => setSidebarOpen(true);
  }, [setSidebarOpen]);

  const [activeDragItem, setActiveDragItem] = useState<PurchaseRequest | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- ACTIONS ---

  const handleCreateRequest = async (data: Partial<PurchaseRequest>) => {
    if (!user) return;
    try {
      const newRequest: any = {
        ...data,
        purchaseNumber: `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, // Simple ID gen
        status: 'Talep Edildi',
        requestDate: new Date().toISOString().split('T')[0],
        requestedBy: user.uid,
        requestedByEmail: user.email,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: new Date().toISOString(),
      };
      await saveDocument(user.uid, 'purchase_requests', newRequest);
      toast.success('Satınalma talebi oluşturuldu');
      setIsNewModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Talep oluşturulurken hata oluştu');
    }
  };

  const handleUpdateRequest = async (id: string, data: Partial<PurchaseRequest>) => {
    if (!user) return;
    try {
      await saveDocument(user.uid, 'purchase_requests', { id, ...data });
      // Store updates via listener automatically
    } catch (error) {
      toast.error('Güncelleme hatası');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!user) return;
    try {
      await deleteDocument(user.uid, 'purchase_requests', id);
      toast.success('Talep silindi');
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  // --- DRAG & DROP HANDLERS ---

  const handleDragStart = (event: DragStartEvent) => {
    const request = requests.find((r) => r.id === event.active.id);
    if (request) setActiveDragItem(request);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual ordering logic is handled by sortable strategy mainly
    // We update status on DragEnd to avoid flickering updates
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over || !user) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the dropped column
    // Case 1: Dropped directly over a column
    let newStatus: PurchaseStatus | undefined = COLUMNS.find((c) => c.id === overId)?.id;

    // Case 2: Dropped over another card -> find that card's column
    if (!newStatus) {
      const overRequest = requests.find((r) => r.id === overId);
      if (overRequest) {
        newStatus = overRequest.status;
      }
    }

    if (newStatus) {
      const request = requests.find((r) => r.id === activeId);
      if (request && request.status !== newStatus) {
        // Optimistic UI update could go here, but we just save
        handleUpdateRequest(activeId, { status: newStatus });
      }
    }
  };

  // Filter requests by column
  const getRequestsByStatus = (status: PurchaseStatus) => {
    return requests.filter((r) => r.status === status && !r.isDeleted);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🛒 Satınalma Yönetimi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Talepleri sürükleyip bırakarak durumlarını güncelleyebilirsiniz.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="text-lg">➕</span>
            <span className="font-medium">Yeni Talep</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
          <div className="flex h-full gap-5 min-w-max pb-2">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                requests={getRequestsByStatus(column.id)}
                onCardClick={setSelectedRequest}
              />
            ))}
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } },
            }),
          }}
        >
          {activeDragItem ? <PurchaseCard request={activeDragItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* MODALS */}
      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdate={handleUpdateRequest}
        onDelete={handleDeleteRequest}
      />
    </div>
  );
};

export default Purchasing;
