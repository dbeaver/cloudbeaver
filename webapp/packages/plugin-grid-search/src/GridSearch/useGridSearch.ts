/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useLayoutEffect, useMemo, type RefObject } from 'react';
import { reaction } from 'mobx';

import { useService } from '@cloudbeaver/core-di';

import { useHotkeys } from '@cloudbeaver/core-blocks';
import type { SearchPanelRef } from '@dbeaver/ui-kit';
import { GridSearchService } from './GridSearchService.js';
import type { IGridSearchAdapter, IGridRef, IGridSearchState } from './IGridSearchAdapter.js';

interface IGridReactiveValue<T, TArgs extends any[]> {
  get(...args: TArgs): T;
  subscribe: (onValueChange: () => void, ...args: TArgs) => () => void;
}

export interface IGridSearchResult {
  searchState: IGridSearchState;
  getCellClassName: IGridReactiveValue<string | undefined, [rowIdx: number, colIdx: number]>;
}

export interface IGridSearchRefs {
  /** Reference to the grid component with scrollToCell method */
  gridRef: RefObject<IGridRef | null>;
  /** Reference to the container element for hotkey scoping */
  containerRef: RefObject<HTMLElement | null>;
  /** Reference to the search panel for auto-focus on open */
  searchPanelRef: RefObject<SearchPanelRef | null>;
  /**
   * Column index offset to apply when scrolling to cells.
   * Use this when the grid has additional columns (e.g., selection checkbox) that aren't in the search adapter.
   */
  colIdxOffset?: number;
}

export function useGridSearch(
  id: string,
  adapter: IGridSearchAdapter,
  refs: IGridSearchRefs,
): IGridSearchResult {
  const { gridRef, containerRef, searchPanelRef, colIdxOffset = 0 } = refs;
  const service = useService(GridSearchService);
  const store = useMemo(() => service.getOrCreateStore(id), [id, service]);

  useLayoutEffect(() => {
    store.setAdapter(adapter);
  }, [store, adapter]);

  useLayoutEffect(() => {
    store.setScrollController(
      gridRef.current?.scrollToCell
        ? {
            scrollToCell: pos =>
              gridRef.current?.scrollToCell?.({
                rowIdx: pos.rowIdx,
                colIdx: pos.colIdx + colIdxOffset,
              }),
          }
        : null,
    );
  }, [store, gridRef, colIdxOffset]);

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
        store.openSearch(() => searchPanelRef.current?.focus());
      }
    },
    { enableOnFormTags: true },
    [store, containerRef, searchPanelRef],
  );

  const getCellClassName = useMemo(
    () => ({
      get: (rowIdx: number, colIdx: number) => {
        const actualColIdx = colIdx - colIdxOffset;
        return store.getCellClassName(rowIdx, actualColIdx);
      },
      subscribe: (onChange: () => void, rowIdx: number, colIdx: number) => {
        const actualColIdx = colIdx - colIdxOffset;
        return reaction(() => store.getCellClassName(rowIdx, actualColIdx), onChange);
      },
    }),
    [store, colIdxOffset],
  );

  return {
    searchState: store,
    getCellClassName,
  };
}
