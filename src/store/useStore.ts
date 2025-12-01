import { create } from 'zustand';
import { createUISlice } from './slices/createUISlice';
import { createDataSlice } from './slices/createDataSlice';
import { StoreState } from './types';

/**
 * Zustand Global Store
 *
 * This store is now refactored into slices for better maintainability and type safety.
 * - UI Slice: Handles UI state (loading, active page, modals)
 * - Data Slice: Handles data collections and business logic selectors
 *
 * Access the store using the standard hook:
 * const activePage = useStore((state) => state.activePage);
 */
const useStore = create<StoreState>()((...a) => ({
  ...createUISlice(...a),
  ...createDataSlice(...a),
}));

export default useStore;
