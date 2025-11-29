import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';

interface ProductSelectorProps {
    products: Product[];
    value: string;
    onChange: (productId: string) => void;
    disabled?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedProduct = products.find(p => p.id === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update search term when value changes externally
    useEffect(() => {
        if (selectedProduct) {
            setSearchTerm(selectedProduct.name);
        } else if (!value) {
            setSearchTerm('');
        }
    }, [selectedProduct, value]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (product: Product) => {
        onChange(product.id);
        setSearchTerm(product.name);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        
        // If input is cleared, clear selection
        if (e.target.value === '') {
            onChange('');
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                disabled={disabled}
                placeholder="Ürün ara..."
                className={`w-full px-3 py-2 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            
            {isOpen && !disabled && filteredProducts.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    {filteredProducts.map(product => (
                        <li
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                product.id === value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{product.name}</span>
                                {product.track_stock && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        (product.stock_quantity || 0) <= (product.minimum_stock || 0)
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    }`}>
                                        Stok: {product.stock_quantity} {product.unit}
                                    </span>
                                )}
                            </div>
                            {product.code && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Kod: {product.code}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            
            {isOpen && !disabled && searchTerm && filteredProducts.length === 0 && (
                <div className="absolute z-50 w-full mt-1 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg text-gray-500 dark:text-gray-400 text-center text-sm">
                    Ürün bulunamadı.
                </div>
            )}
        </div>
    );
};

export default ProductSelector;
