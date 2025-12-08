import React, { useState } from 'react';
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
import { CSS } from '@dnd-kit/utilities';
import { PurchaseRequest, PurchaseStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// --- MOCK DATA ---
const MOCK_REQUESTS: PurchaseRequest[] = [
  {
    id: '1',
    purchaseNumber: 'SAT-2024-001',
    productId: 'prod1',
    productName: 'Galvaniz Sac 2mm',
    quantity: 500,
    unit: 'Kg',
    priority: 'Yüksek',
    status: 'Talep Edildi',
    requestedBy: 'user1',
    requestedByEmail: 'ahmet@example.com',
    requestDate: '2024-12-08',
    currency: 'TRY',
    createdBy: 'user1',
    createdByEmail: 'ahmet@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    purchaseNumber: 'SAT-2024-002',
    productId: 'prod2',
    productName: 'Kutu Profil 40x40',
    quantity: 100,
    unit: 'Adet',
    priority: 'Orta',
    status: 'Araştırılıyor',
    requestedBy: 'user1',
    requestedByEmail: 'ahmet@example.com',
    requestDate: '2024-12-07',
    currency: 'TRY',
    createdBy: 'user1',
    createdByEmail: 'ahmet@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    purchaseNumber: 'SAT-2024-003',
    productId: 'prod3',
    productName: 'DKP Sac 1mm',
    quantity: 250,
    unit: 'Kg',
    priority: 'Düşük',
    status: 'Teklif Bekleniyor',
    supplierName: 'Demir Çelik A.Ş.',
    requestedBy: 'user1',
    requestedByEmail: 'ahmet@example.com',
    requestDate: '2024-12-06',
    currency: 'TRY',
    createdBy: 'user1',
    createdByEmail: 'ahmet@example.com',
    createdAt: new Date().toISOString(),
  },
];

const COLUMNS: { id: PurchaseStatus; title: string; color: string }[] = [
  { id: 'Talep Edildi', title: 'Talep Edildi', color: 'bg-gray-100 border-gray-200' },
  { id: 'Araştırılıyor', title: 'Araştırılıyor', color: 'bg-blue-50 border-blue-200' },
  { id: 'Teklif Bekleniyor', title: 'Teklif Bekleniyor', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'Sipariş Verildi', title: 'Sipariş Verildi', color: 'bg-purple-50 border-purple-200' },
  { id: 'Depoya Girdi', title: 'Depoya Girdi', color: 'bg-green-50 border-green-200' },
];

// --- COMPONENTS ---

// 1. Kanban Card Component
const PurchaseCard = ({
  request,
  isOverlay = false,
}: {
  request: PurchaseRequest;
  isOverlay?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
    data: {
      type: 'Request',
      request,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
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

  const priorityColors = {
    Düşük: 'bg-gray-100 text-gray-800',
    Orta: 'bg-yellow-100 text-yellow-800',
    Yüksek: 'bg-orange-100 text-orange-800',
    Acil: 'bg-red-100 text-red-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-xl scale-105 rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">{request.purchaseNumber}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[request.priority]}`}
        >
          {request.priority}
        </span>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
        {request.productName}
      </h4>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {request.quantity} {request.unit}
      </div>

      {request.supplierName && (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <span>🏢</span>
          <span className="truncate">{request.supplierName}</span>
        </div>
      )}
    </div>
  );
};

// 2. Kanban Column Component
const KanbanColumn = ({
  column,
  requests,
}: {
  column: (typeof COLUMNS)[0];
  requests: PurchaseRequest[];
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
      className={`flex flex-col h-full min-w-[280px] w-[280px] rounded-xl ${column.color} dark:bg-gray-800 dark:border-gray-700 border p-2`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-2 mb-2">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
          {column.title}
          <span className="bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300 shadow-sm">
            {requests.length}
          </span>
        </h3>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2 p-1 custom-scrollbar">
        <SortableContext items={requests.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {requests.map((request) => (
            <PurchaseCard key={request.id} request={request} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// 3. Main Page Component
const Purchasing: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>(MOCK_REQUESTS);
  const [activeDragItem, setActiveDragItem] = useState<PurchaseRequest | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag (prevents accidental clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find((r) => r.id === active.id);
    if (request) setActiveDragItem(request);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Request';
    const isOverTask = over.data.current?.type === 'Request';

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setRequests((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const updated = [...prev];
          updated[activeIndex].status = prev[overIndex].status;
          return arrayMove(updated, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    const isOverColumn = over.data.current?.type === 'Column';

    // Dropping a Task over a Column
    if (isActiveTask && isOverColumn) {
      setRequests((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const updated = [...prev];
        updated[activeIndex].status = overId as PurchaseStatus;
        return arrayMove(updated, activeIndex, activeIndex); // Position doesn't matter much here
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Request';
    const isOverColumn = over.data.current?.type === 'Column';

    if (isActiveTask && isOverColumn) {
      // Status update is handled in DragOver for smoother visual
      // Here we would typically persist to backend
      console.log(`Moved request ${activeId} to column ${overId}`);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Satınalma Yönetimi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Talepleri sürükleyip bırakarak durumlarını güncelleyebilirsiniz.
          </p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          onClick={() => alert('Form modalı açılacak')}
        >
          <span>➕</span>
          <span>Yeni Talep</span>
        </button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-4">
          <div className="flex h-full gap-4 min-w-max">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                requests={requests.filter((r) => r.status === column.id)}
              />
            ))}
          </div>
        </div>

        {/* Drag Overlay (Visual helper while dragging) */}
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
    </div>
  );
};

export default Purchasing;
