import { useState, useCallback, useMemo } from 'react';

export interface UseTableSelectionOptions<T> {
  getItemId: (item: T) => string;
  items?: T[];
}

export interface UseTableSelectionReturn<T> {
  selectedItems: T[];
  selectedIds: Set<string>;
  isSelected: (item: T) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  selectItem: (item: T) => void;
  deselectItem: (item: T) => void;
  toggleItem: (item: T) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleAll: () => void;
  setSelectedItems: (items: T[]) => void;
  clearSelection: () => void;
}

export const useTableSelection = <T>({
  getItemId,
  items = [],
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get actually selected items from current items list
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if an item is selected
  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item));
  }, [selectedIds, getItemId]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if some (but not all) items are selected
  const isPartiallySelected = useMemo(() => {
    const selectedCount = items.filter(item => selectedIds.has(getItemId(item))).length;
    return selectedCount > 0 && selectedCount < items.length;
  }, [items, selectedIds, getItemId]);

  // Select a single item
  const selectItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [getItemId]);

  // Deselect a single item
  const deselectItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [getItemId]);

  // Toggle selection of a single item
  const toggleItem = useCallback((item: T) => {
    if (isSelected(item)) {
      deselectItem(item);
    } else {
      selectItem(item);
    }
  }, [isSelected, selectItem, deselectItem]);

  // Select all items
  const selectAll = useCallback(() => {
    const newSet = new Set<string>();
    items.forEach(item => {
      newSet.add(getItemId(item));
    });
    setSelectedIds(newSet);
  }, [items, getItemId]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle all items selection
  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // Set selected items directly
  const setSelectedItems = useCallback((newSelectedItems: T[]) => {
    const newSet = new Set<string>();
    newSelectedItems.forEach(item => {
      newSet.add(getItemId(item));
    });
    setSelectedIds(newSet);
  }, [getItemId]);

  // Clear selection (alias for deselectAll)
  const clearSelection = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  return {
    selectedItems,
    selectedIds,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    setSelectedItems,
    clearSelection,
  };
};

export default useTableSelection;