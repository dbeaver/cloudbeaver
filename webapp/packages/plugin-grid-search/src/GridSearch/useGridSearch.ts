/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { useHotkeys } from '@cloudbeaver/core-blocks';
import { GridSearchService } from './GridSearchService.js';
import type { IGridSearchAdapter, IGridScrollController, IGridSearchState } from './IGridSearchAdapter.js';

export interface UseGridSearchOptions {
  /** Callback to invoke when search panel opens (e.g., to focus search input) */
  onOpen?: () => void;
}

/**
 * Hook to enable search functionality for a grid.
 *
 * @param id - Unique identifier for this search state (e.g., 'query-history-123')
 * @param adapter - Grid data adapter implementing IGridSearchAdapter
 * @param scrollController - Controller for scrolling to cells (can be null if not available yet)
 * @param containerRef - Reference to the container element for hotkey scoping
 * @param options - Optional configuration
 * @returns The grid search state object
 *
 * @example
 * ```tsx
 * const gridRef = useRef<DataGridRef>(null);
 * const containerRef = useRef<HTMLDivElement>(null);
 * const searchPanelRef = useRef<SearchPanelRef>(null);
 *
 * const adapter = useMemo(() => ({
 *   getRowCount: () => data.length,
 *   getColumnCount: () => columns.length,
 *   getCellText: (rowIdx, colIdx) => data[rowIdx][columns[colIdx]],
 * }), [data, columns]);
 *
 * const scrollController = useMemo(() => ({
 *   scrollToCell: (pos) => gridRef.current?.scrollToCell(pos),
 * }), []);
 *
 * const search = useGridSearch('grid', adapter, scrollController, containerRef, {
 *   onOpen: () => searchPanelRef.current?.focus(),
 * });
 * ```
 */
export function useGridSearch(
  id: string,
  adapter: IGridSearchAdapter,
  scrollController: IGridScrollController | null,
  containerRef: RefObject<HTMLElement | null>,
  options?: UseGridSearchOptions,
): IGridSearchState {
  const service = useService(GridSearchService);
  const store = useMemo(() => service.getOrCreateStore(id), [id, service]);
  const optionsRef = useRef(options);

  useLayoutEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useLayoutEffect(() => {
    store.setAdapter(adapter);
  }, [store, adapter]);

  useLayoutEffect(() => {
    store.setScrollController(scrollController);
  }, [store, scrollController]);

  useHotkeys(
    'mod+f',
    e => {
      e.preventDefault();
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const activeElement = document.activeElement;
      if (container.contains(activeElement) || container === activeElement) {
        store.openSearch(() => optionsRef.current?.onOpen?.());
      }
    },
    { enableOnFormTags: true },
    [store, containerRef],
  );

  return store;
}
