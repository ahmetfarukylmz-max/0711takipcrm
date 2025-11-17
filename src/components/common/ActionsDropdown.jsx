import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '../icons';

const DROPDOWN_HEIGHT_ESTIMATE = 200; // Estimate of the dropdown height in pixels

const ActionsDropdown = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState('bottom');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isOpen) {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;

                if (spaceBelow < DROPDOWN_HEIGHT_ESTIMATE) {
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            }
        }

        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const dropdownClasses = `
        absolute right-0 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10
        ${position === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'}
    `;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef} onKeyDown={handleKeyDown}>
            <button
                onClick={handleToggle}
                aria-label="İşlemler menüsü"
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                title="Ek işlemleri açmak için tıklayın (Escape to close)"
            >
                İşlemler
                <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </button>

            {isOpen && (
                <div className={dropdownClasses} role="menu">
                    <div className="py-1">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        action.onClick();
                                        setIsOpen(false);
                                    }
                                }}
                                role="menuitem"
                                className={`block w-full text-left px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                                    action.destructive
                                        ? 'text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;
