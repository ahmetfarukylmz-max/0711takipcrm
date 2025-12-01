import { useState, useCallback } from 'react';

interface ConfirmState<T> {
  isOpen: boolean;
  item: T | null;
  title?: string;
  message?: string;
}

/**
 * Custom hook for managing confirmation dialogs (delete, cancel, etc.)
 * @returns {Object} { isOpen, item, ask, close }
 */
export const useConfirm = <T = any>() => {
  const [state, setState] = useState<ConfirmState<T>>({
    isOpen: false,
    item: null,
  });

  const ask = useCallback((item: T) => {
    setState({ isOpen: true, item });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, item: null }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.item, // 'item' yerine 'data' daha genel olabilir ama uyum için bakarız
    ask,
    close,
  };
};
