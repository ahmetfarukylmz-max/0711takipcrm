import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormTextarea from '../common/FormTextarea';
import FormInput from '../common/FormInput';
import { REJECTION_REASONS } from '../../constants';
import type { Quote } from '../../types';

interface QuoteRejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    reasonId: string;
    reasonNote: string;
    targetPrice?: number;
    competitorName?: string;
    reminderDate?: string;
  }) => void;
  quote: Quote | null;
}

const QuoteRejectionDialog: React.FC<QuoteRejectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quote,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [note, setNote] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderOption, setReminderOption] = useState<string>('none');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonId('');
      setNote('');
      setTargetPrice('');
      setCompetitorName('');
      setReminderDate('');
      setReminderOption('none');
    }
  }, [isOpen, quote]);

  // Handle auto-reminder dates
  const handleReminderOptionChange = (option: string) => {
    setReminderOption(option);
    const today = new Date();

    if (option === '1month') {
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
      setReminderDate(nextMonth.toISOString().split('T')[0]);
    } else if (option === '3months') {
      const next3Months = new Date(today.setMonth(today.getMonth() + 3));
      setReminderDate(next3Months.toISOString().split('T')[0]);
    } else if (option === 'custom') {
      setReminderDate(''); // Let user pick
    } else {
      setReminderDate('');
    }
  };

  const handleSubmit = () => {
    if (!selectedReasonId) {
      alert('Lütfen bir red sebebi seçin.');
      return;
    }

    const reasonConfig = REJECTION_REASONS.find((r) => r.id === selectedReasonId);

    // Validation
    if (reasonConfig?.requirePrice && !targetPrice) {
      // Optional warning or force? Let's keep it optional but encouraged
    }

    onConfirm({
      reasonId: selectedReasonId,
      reasonNote: note,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      competitorName: competitorName || undefined,
      reminderDate: reminderDate || undefined,
    });
  };

  const selectedReasonConfig = REJECTION_REASONS.find((r) => r.id === selectedReasonId);

  return (
    <Modal show={isOpen} onClose={onClose} title="Teklifi Reddet" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* 1. SEBEP SEÇİMİ (Butonlar) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Reddedilme Sebebi
          </label>
          <div className="grid grid-cols-2 gap-3">
            {REJECTION_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReasonId(reason.id)}
                className={`p-3 text-sm font-medium rounded-lg border transition-all text-left flex items-center gap-2
                  ${
                    selectedReasonId === reason.id
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 ring-1 ring-red-500'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
              >
                <span>{reason.label.split(' ')[0]}</span> {/* Emoji */}
                <span>{reason.label.substring(reason.label.indexOf(' ') + 1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. AKILLI ALANLAR (Koşullu) */}
        {selectedReasonId && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700 animate-fadeIn">
            {/* Fiyat Farkı Analizi */}
            {selectedReasonConfig?.requirePrice && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📉 Müşterinin Hedef Fiyatı / Bütçesi (Opsiyonel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Örn: 90000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-red-500 focus:border-red-500"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">
                    {quote?.currency || 'TRY'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Bizim Teklif:{' '}
                  <span className="font-semibold">
                    {quote?.total_amount?.toLocaleString()} {quote?.currency}
                  </span>
                </p>
              </div>
            )}

            {/* Rakip Analizi */}
            {selectedReasonConfig?.requireCompetitor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  🤝 Hangi Rakip Tercih Edildi? (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="Firma adı..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {/* Not Alanı (Her zaman açık ama kısa) */}
            <FormTextarea
              label="Ek Açıklama / Not"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detaylı açıklama..."
              rows={2}
            />
          </div>
        )}

        {/* 3. GERİ KAZANIM (Win-Back) */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ⏰ Geri Kazanım Hatırlatması
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: 'none', label: 'Yok' },
              { id: '1month', label: '1 Ay Sonra' },
              { id: '3months', label: '3 Ay Sonra' },
              { id: 'custom', label: 'Tarih Seç...' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleReminderOptionChange(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                  ${
                    reminderOption === opt.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {reminderOption === 'custom' && (
            <FormInput
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
          )}
          {reminderOption !== 'none' && reminderDate && (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(reminderDate).toLocaleDateString('tr-TR')} tarihinde hatırlatma
              oluşturulacak.
            </p>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedReasonId}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Teklifi Reddet ve Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuoteRejectionDialog;
