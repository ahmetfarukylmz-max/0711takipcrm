import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state and data
 * @returns {Object} { isOpen, data, open, close }
 */
export const useModal = <T = any>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((item?: T) => {
    if (item) setData(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optional: clear data on close or keep it?
    // Clearing it prevents showing old data when reopening
    setTimeout(() => setData(null), 300); // Delay clearing to allow transition
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
  };
};
