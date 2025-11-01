import React, { useState } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import QuoteForm from '../forms/QuoteForm';
import SearchBar from '../common/SearchBar';
import { PlusIcon } from '../icons';
import { formatDate, formatCurrency, getStatusClass } from '../../utils/formatters';

const Quotes = ({ quotes, onSave, onDelete, onConvertToOrder, customers, products }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [selectedItems, setSelectedItems] = useState(new Set());

    const handleOpenModal = (quote = null) => {
        setCurrentQuote(quote);
        setIsModalOpen(true);
    };

    const handleSave = (quoteData) => {
        onSave(quoteData);
        setIsModalOpen(false);
    };

    const handleDelete = (item) => {
        setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            if (deleteConfirm.item.id === 'batch') {
                confirmBatchDelete();
            } else {
                onDelete(deleteConfirm.item.id);
                setDeleteConfirm({ isOpen: false, item: null });
            }
        }
    };

    // Batch delete functions
    const handleSelectItem = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === filteredQuotes.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredQuotes.map(q => q.id)));
        }
    };

    const handleBatchDelete = () => {
        setDeleteConfirm({
            isOpen: true,
            item: { id: 'batch', count: selectedItems.size }
        });
    };

    const confirmBatchDelete = () => {
        selectedItems.forEach(id => onDelete(id));
        setSelectedItems(new Set());
        setDeleteConfirm({ isOpen: false, item: null });
    };

    const handlePrint = (quote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        if (!customer) {
            alert('Müşteri bilgileri bulunamadı!');
            return;
        }

        // Şirket bilgileri - Kendi bilgilerinizle değiştirebilirsiniz
        const companyInfo = {
            name: "AKÇELİK METAL SANAYİ",
            address: "Organize Sanayi Bölgesi, Sanayi Cd. No:1, Bursa",
            phone: "0224 123 45 67",
            email: "info@akcelik.com.tr",
            logoUrl: "https://i.ibb.co/rGFcQ4GB/logo-Photoroom.png"
        };

        const itemsHtml = (quote.items || []).map(item => {
            const product = products.find(p => p.id === item.productId);
            return `
                <tr class="border-b">
                    <td class="py-2 px-4">${product?.name || item.product_name || 'Bilinmeyen Ürün'}</td>
                    <td class="py-2 px-4 text-center">${item.quantity || 0} ${item.unit || 'Adet'}</td>
                    <td class="py-2 px-4 text-right">${formatCurrency(item.unit_price || 0, quote.currency || 'TRY')}</td>
                    <td class="py-2 px-4 text-right">${formatCurrency((item.quantity || 0) * (item.unit_price || 0), quote.currency || 'TRY')}</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <html>
            <head>
                <title>Teklif #${quote.id?.substring(0, 8) || 'XXXX'}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body class="bg-gray-100 font-sans p-8">
                <div class="max-w-4xl mx-auto bg-white p-12 shadow-2xl rounded-lg">
                    <header class="flex justify-between items-start pb-8 border-b">
                        <div>
                            <img src="${companyInfo.logoUrl}" alt="${companyInfo.name} Logosu" class="h-20 mb-4"/>
                            <h1 class="text-2xl font-bold text-gray-800">${companyInfo.name}</h1>
                            <p class="text-sm text-gray-500">${companyInfo.address}</p>
                            <p class="text-sm text-gray-500">${companyInfo.phone} | ${companyInfo.email}</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-4xl font-bold uppercase text-blue-600">Teklif</h2>
                            <p class="text-sm text-gray-500 mt-2">Teklif No: #${quote.id?.substring(0, 8).toUpperCase() || 'XXXX'}</p>
                            <p class="text-sm text-gray-500">Tarih: ${formatDate(quote.teklif_tarihi)}</p>
                            <p class="text-sm text-gray-500">Geçerlilik: ${formatDate(quote.gecerlilik_tarihi)}</p>
                        </div>
                    </header>

                    <section class="mt-8">
                        <h3 class="text-lg font-semibold text-gray-700">Müşteri Bilgileri</h3>
                        <div class="bg-gray-50 p-4 rounded-md mt-2 text-sm">
                            <p class="font-bold text-gray-800">${customer.name}</p>
                            <p>${customer.address || ''}, ${customer.sehir || ''}</p>
                            <p>${customer.phone || ''}</p>
                            <p>${customer.email || ''}</p>
                        </div>
                    </section>

                    <section class="mt-8">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="py-2 px-4 text-left font-semibold text-gray-600">Ürün/Hizmet</th>
                                    <th class="py-2 px-4 text-center font-semibold text-gray-600">Miktar</th>
                                    <th class="py-2 px-4 text-right font-semibold text-gray-600">Birim Fiyat</th>
                                    <th class="py-2 px-4 text-right font-semibold text-gray-600">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </section>

                    <section class="mt-8 flex justify-end">
                        <div class="w-1/2">
                            <div class="flex justify-between text-sm py-2 border-b">
                                <span class="font-semibold text-gray-600">Ara Toplam:</span>
                                <span>${formatCurrency(quote.subtotal || 0, quote.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between text-sm py-2 border-b">
                                <span class="font-semibold text-gray-600">KDV (%${quote.vatRate || 10}):</span>
                                <span>${formatCurrency(quote.vatAmount || 0, quote.currency || 'TRY')}</span>
                            </div>
                            <div class="flex justify-between text-xl font-bold py-3 bg-gray-100 px-4 rounded-md">
                                <span class="text-gray-800">Genel Toplam:</span>
                                <span class="text-blue-600">${formatCurrency(quote.total_amount || 0, quote.currency || 'TRY')}</span>
                            </div>
                        </div>
                    </section>

                    <section class="mt-8 bg-blue-50 p-4 rounded-md">
                        <h3 class="text-md font-semibold text-gray-700 mb-2">Ödeme Koşulları</h3>
                        <div class="text-sm text-gray-600">
                            <p><strong>Ödeme Tipi:</strong> ${quote.paymentType || 'Peşin'}</p>
                            ${quote.paymentType === 'Vadeli' && quote.paymentTerm ? `<p><strong>Vade Süresi:</strong> ${quote.paymentTerm} gün</p>` : ''}
                            ${quote.paymentType === 'Peşin' ? '<p class="mt-2 text-green-700 font-medium">✓ Peşin ödemede geçerlidir</p>' : ''}
                        </div>
                    </section>

                    <section class="border-t-2 border-gray-300 pt-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <div class="h-28 border-b-2 border-gray-400 mb-3"></div>
                                <p class="text-sm font-semibold text-gray-700">${companyInfo.name}</p>
                                <p class="text-xs text-gray-500">Yetkili İmza ve Kaşe</p>
                            </div>
                            <div class="text-center">
                                <div class="h-28 border-b-2 border-gray-400 mb-3"></div>
                                <p class="text-sm font-semibold text-gray-700">${customer.name}</p>
                                <p class="text-xs text-gray-500">Müşteri İmza ve Kaşe</p>
                            </div>
                        </div>
                    </section>

                    <footer class="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                        <p>Teklifimizle ilgilendiğiniz için teşekkür ederiz.</p>
                        <p>Bu teklif ${formatDate(quote.gecerlilik_tarihi)} tarihine kadar geçerlidir.</p>
                    </footer>
                </div>
                <div class="text-center mt-8 no-print">
                    <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Yazdır</button>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Filter out deleted quotes
    const activeQuotes = quotes.filter(item => !item.isDeleted);

    // Apply search and status filter
    const filteredQuotes = activeQuotes.filter(quote => {
        const customer = customers.find(c => c.id === quote.customerId);
        const customerName = customer?.name || '';
        const amount = (quote.total_amount || 0).toString();
        const date = formatDate(quote.teklif_tarihi);

        const matchesSearch =
            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            amount.includes(searchQuery) ||
            date.includes(searchQuery);

        const matchesStatus = statusFilter === 'Tümü' || quote.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statuses = ['Tümü', 'Hazırlandı', 'Onaylandı', 'Reddedildi'];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Teklif Yönetimi</h1>
                <div className="flex gap-3">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Seçili {selectedItems.size} Teklifi Sil
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <PlusIcon />
                        Yeni Teklif
                    </button>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Müşteri adı, tutar veya tarih ile ara..."
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Toplam {filteredQuotes.length} teklif gösteriliyor
                    </p>
                </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 hidden md:table-header-group">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={filteredQuotes.length > 0 && selectedItems.size === filteredQuotes.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            {['Müşteri', 'Teklif Tarihi', 'Geçerlilik Tarihi', 'Tutar', 'Ödeme', 'Durum', 'İşlemler'].map(h => (
                                <th key={h} className="p-3 text-sm font-semibold tracking-wide text-left text-gray-700 dark:text-gray-200">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 md:divide-none">
                        {filteredQuotes.length > 0 ? (
                            filteredQuotes.map(quote => (
                                <tr
                                    key={quote.id}
                                    className="block md:table-row border-b md:border-none mb-4 md:mb-0 rounded-lg md:rounded-none shadow md:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <td className="p-3 text-sm block md:table-cell text-center border-b md:border-none">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(quote.id)}
                                            onChange={() => handleSelectItem(quote.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-bold block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Müşteri:{' '}
                                        </span>
                                        {customers.find(c => c.id === quote.customerId)?.name || 'Bilinmiyor'}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Teklif Tarihi:{' '}
                                        </span>
                                        {formatDate(quote.teklif_tarihi)}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Geçerlilik:{' '}
                                        </span>
                                        {formatDate(quote.gecerlilik_tarihi)}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Tutar:{' '}
                                        </span>
                                        {formatCurrency(quote.total_amount, quote.currency || 'TRY')}
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Ödeme:{' '}
                                        </span>
                                        <span className={`p-1.5 text-xs font-medium rounded-lg ${quote.paymentType === 'Peşin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                                            {quote.paymentType || 'Peşin'}
                                            {quote.paymentType === 'Vadeli' && quote.paymentTerm && ` (${quote.paymentTerm} gün)`}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            Durum:{' '}
                                        </span>
                                        <span
                                            className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${getStatusClass(quote.status)}`}
                                        >
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm block md:table-cell text-right md:text-left border-b md:border-none">
                                        <span className="float-left font-semibold text-gray-500 dark:text-gray-400 md:hidden uppercase tracking-wider text-xs">
                                            İşlemler:{' '}
                                        </span>
                                        <div className="flex flex-wrap gap-2 justify-end md:justify-start">
                                            <button
                                                onClick={() => handleOpenModal(quote)}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Detay
                                            </button>
                                            <button
                                                onClick={() => handlePrint(quote)}
                                                className="text-purple-500 hover:underline"
                                            >
                                                PDF
                                            </button>
                                            {quote.status !== 'Onaylandı' && (
                                                <button
                                                    onClick={() => onConvertToOrder(quote)}
                                                    className="text-green-500 hover:underline"
                                                >
                                                    Siparişe Çevir
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(quote)}
                                                className="text-red-500 hover:underline"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || statusFilter !== 'Tümü'
                                        ? 'Arama kriterlerine uygun teklif bulunamadı.'
                                        : 'Henüz teklif eklenmemiş. "Yeni Teklif" butonuna tıklayarak ilk teklifinizi oluşturun.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentQuote ? 'Teklif Detayı' : 'Yeni Teklif Oluştur'}
                maxWidth="max-w-4xl"
            >
                <QuoteForm
                    quote={currentQuote}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    customers={customers}
                    products={products}
                />
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title={deleteConfirm.item?.id === 'batch' ? 'Toplu Silme' : 'Teklifi Sil'}
                message={
                    deleteConfirm.item?.id === 'batch'
                        ? `Seçili ${deleteConfirm.item?.count} teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                        : `"${deleteConfirm.item?.id}" teklifini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
                }
            />
        </div>
    );
};

export default Quotes;
