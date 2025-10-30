import React, { useState } from 'react';
import Modal from '../common/Modal';
import QuoteForm from '../forms/QuoteForm';
import { PlusIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';

const Quotes = ({ quotes, onSave, onConvertToOrder, customers, products }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuote, setCurrentQuote] = useState(null);

    const handleOpenModal = (quote = null) => {
        setCurrentQuote(quote);
        setIsModalOpen(true);
    };

    const handleSave = (quoteData) => {
        onSave(quoteData);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Teklif Yönetimi</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    <PlusIcon />
                    Yeni Teklif
                </button>
            </div>
            <div className="overflow-auto rounded-lg shadow bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {['Müşteri', 'Teklif Tarihi', 'Geçerlilik Tarihi', 'Tutar', 'Durum', 'İşlemler'].map(h => (
                                <th key={h} className="p-3 text-sm font-semibold tracking-wide text-left">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {quotes.map(quote => (
                            <tr key={quote.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-bold">
                                    {customers.find(c => c.id === quote.customerId)?.name || 'Bilinmiyor'}
                                </td>
                                <td className="p-3 text-sm text-gray-700">{formatDate(quote.teklif_tarihi)}</td>
                                <td className="p-3 text-sm text-gray-700">{formatDate(quote.gecerlilik_tarihi)}</td>
                                <td className="p-3 text-sm text-gray-700">{formatCurrency(quote.total_amount)}</td>
                                <td className="p-3 text-sm">
                                    <span
                                        className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(quote.status)}`}
                                    >
                                        {quote.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(quote)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Detay
                                    </button>
                                    {quote.status !== 'Onaylandı' && (
                                        <button
                                            onClick={() => onConvertToOrder(quote)}
                                            className="text-green-500 hover:underline"
                                        >
                                            Siparişe Çevir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentQuote ? 'Teklif Detayı' : 'Yeni Teklif Oluştur'}
            >
                <QuoteForm
                    quote={currentQuote}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    customers={customers}
                    products={products}
                />
            </Modal>
        </div>
    );
};

export default Quotes;
