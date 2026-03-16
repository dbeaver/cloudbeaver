/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ICellChange } from './DataGridCellContext.js';
import type { IGridReactiveValue } from './IGridReactiveValue.js';
import type { GridSearchPanelRef } from './search/GridSearchPanel.js';
import type { IGridSearchStorage } from './search/useGridSearch.js';

interface UseDataGridSearchOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  searchStorage: IGridSearchStorage | undefined;
  getCellEditable: ((rowIdx: number, colIdx: number) => boolean) | undefined;
  onCellChangeBatch: ((updates: ICellChange[]) => void) | undefined;
}

export function useDataGridSearch({ containerRef, searchStorage, getCellEditable, onCellChangeBatch }: UseDataGridSearchOptions): {
  searchOpen: boolean;
  searchCellClassName: IGridReactiveValue<string | undefined, [number, number]> | undefined;
  searchPanelRef: React.RefObject<GridSearchPanelRef | null>;
  setSearchPanelRef: (instance: GridSearchPanelRef | null) => void;
  isReplacingRef: React.RefObject<boolean>;
  handleSearchOpen: () => void;
  handleSearchClose: () => void;
  onReplace: (updates: { rowIdx: number; colIdx: number; value: string }[]) => void;
  handleReplacingChange: (value: boolean) => void;
} {
  const searchPanelRef = useRef<GridSearchPanelRef | null>(null);
  const isReplacingRef = useRef<boolean>(false);

  const [searchOpen, setSearchOpen] = useState(() => searchStorage?.get()?.open ?? false);
  const [searchCellClassName, setSearchCellClassName] = useState<IGridReactiveValue<string | undefined, [number, number]>>();

  const setSearchPanelRef = useCallback((instance: GridSearchPanelRef | null) => {
    searchPanelRef.current = instance;
    setSearchCellClassName(instance?.getCellClassName);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        setSearchOpen(true);
        searchPanelRef.current?.focus();
      }
    }

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);

  function handleSearchOpen() {
    setSearchOpen(true);
    searchPanelRef.current?.focus();
  }

  function handleSearchClose() {
    setSearchOpen(false);
    containerRef.current?.querySelector<HTMLDivElement>('[aria-selected="true"]')?.focus();
  }

  function onReplace(updates: { rowIdx: number; colIdx: number; value: string }[]) {
    const validUpdates = updates.filter(u => getCellEditable?.(u.rowIdx, u.colIdx) !== false);
    if (validUpdates.length > 0) {
      onCellChangeBatch?.(validUpdates);
    }
  }

  function handleReplacingChange(value: boolean) {
    isReplacingRef.current = value;
  }

  return {
    searchOpen,
    searchCellClassName,
    searchPanelRef,
    setSearchPanelRef,
    isReplacingRef,
    handleSearchOpen,
    handleSearchClose,
    onReplace,
    handleReplacingChange,
  };
}
