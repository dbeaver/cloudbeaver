/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import type { IGridReactiveValue } from '../IGridReactiveValue.js';
import { buildSearchPattern, replaceInCell, searchGrid, type ICellMatch } from './GridSearchEngine.js';

export type { ICellMatch } from './GridSearchEngine.js';

const DEFAULT_DEBOUNCE_MS = 300;

export interface ISearchState {
  matchedCells: ICellMatch[];
  activeMatchIdx: number;
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
  replaceOpen: boolean;
  open: boolean;
}

export interface IGridSearchStorage {
  get(): ISearchState | undefined;
  set(state: ISearchState): void;
  update(state: Partial<ISearchState>): void;
}
const MATCH_CLASS = 'rdg-cell-search-match';
const ACTIVE_CLASS = 'rdg-cell-search-match rdg-cell-search-active';

type CellKey = `${number}+${number}`;

function makeCellKey(rowIdx: number, colIdx: number): CellKey {
  return `${rowIdx}+${colIdx}`;
}

export interface IGridSearchSnapshot {
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
  matchCount: number;
  activeMatchIndex: number;
}

export interface IGridSearchActions {
  setQuery: (value: string) => void;
  setReplace: (value: string) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleRegex: () => void;
  findNext: () => void;
  findPrevious: () => void;
  replaceActive: () => void;
  replaceAll: () => void;
  setReplaceOpen: (open: boolean) => void;
  refresh: () => void;
  close: () => void;
}

export interface ICellValueUpdate {
  rowIdx: number;
  colIdx: number;
  value: string;
}

export interface IGridSearchOptions {
  rowCount: number;
  columnCount: number;
  getCellText: (rowIdx: number, colIdx: number) => string;
  scrollToCell: (rowIdx: number, colIdx: number) => void;
  replaceCellValue: (rowIdx: number, colIdx: number, value: string) => void;
  replaceCellValues?: (updates: ICellValueUpdate[]) => void;
  onReplacingChange?: (isReplacing: boolean) => void;
  storage?: IGridSearchStorage;
  open?: boolean;
}

interface GridSearchStore {
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
  replaceOpen: boolean;
  matchedCells: ICellMatch[];
  matchedSet: Set<CellKey>;
  activeMatchIdx: number;
  activeMatchKey: CellKey | null;

  listeners: Set<() => void>;
  cellListeners: Set<() => void>;
  snapshotCache: IGridSearchSnapshot | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  disposed: boolean;

  options: IGridSearchOptions;
}

function createStore(options: IGridSearchOptions): GridSearchStore {
  const cached = options.storage?.get();
  const hasCache = cached && cached.matchedCells.length > 0;

  return {
    query: cached?.query ?? '',
    replace: cached?.replace ?? '',
    caseSensitive: cached?.caseSensitive ?? false,
    wholeWord: cached?.wholeWord ?? false,
    regexp: cached?.regexp ?? false,
    replaceOpen: cached?.replaceOpen ?? false,
    matchedCells: hasCache ? cached!.matchedCells : [],
    matchedSet: hasCache ? new Set(cached!.matchedCells.map(m => makeCellKey(m.rowIdx, m.colIdx))) : new Set<CellKey>(),
    activeMatchIdx: hasCache ? cached!.activeMatchIdx : -1,
    activeMatchKey:
      hasCache && cached!.matchedCells[cached!.activeMatchIdx]
        ? makeCellKey(cached!.matchedCells[cached!.activeMatchIdx]!.rowIdx, cached!.matchedCells[cached!.activeMatchIdx]!.colIdx)
        : null,
    listeners: new Set(),
    cellListeners: new Set(),
    snapshotCache: null,
    debounceTimer: null,
    disposed: false,
    options,
  };
}

function getSnapshot(store: GridSearchStore): IGridSearchSnapshot {
  if (!store.snapshotCache) {
    store.snapshotCache = {
      query: store.query,
      replace: store.replace,
      caseSensitive: store.caseSensitive,
      wholeWord: store.wholeWord,
      regexp: store.regexp,
      matchCount: store.matchedCells.length,
      activeMatchIndex: store.activeMatchIdx,
    };
  }
  return store.snapshotCache;
}

function invalidateSnapshot(store: GridSearchStore): void {
  store.snapshotCache = null;
}

function notifyListeners(store: GridSearchStore): void {
  for (const listener of store.listeners) {
    listener();
  }
}

function notifyCellListeners(store: GridSearchStore): void {
  for (const listener of store.cellListeners) {
    listener();
  }
}

function syncState(store: GridSearchStore): void {
  store.options.storage?.set({
    matchedCells: store.matchedCells,
    activeMatchIdx: store.activeMatchIdx,
    query: store.query,
    replace: store.replace,
    caseSensitive: store.caseSensitive,
    wholeWord: store.wholeWord,
    regexp: store.regexp,
    replaceOpen: store.replaceOpen,
    open: store.options.open ?? true,
  });
}

function updateGridSearch(store: GridSearchStore): void {
  invalidateSnapshot(store);
  notifyListeners(store);
  syncState(store);
}

function buildPattern(store: GridSearchStore): RegExp | null {
  return buildSearchPattern(store.query, {
    caseSensitive: store.caseSensitive,
    wholeWord: store.wholeWord,
    regexp: store.regexp,
  });
}

function updateActiveMatchKey(store: GridSearchStore): void {
  const match = store.matchedCells[store.activeMatchIdx];
  store.activeMatchKey = match ? makeCellKey(match.rowIdx, match.colIdx) : null;
}

function updateMatches(store: GridSearchStore, preserveActiveIndex = false): void {
  const matches = searchGrid(
    store.query,
    { caseSensitive: store.caseSensitive, wholeWord: store.wholeWord, regexp: store.regexp },
    store.options.rowCount,
    store.options.columnCount,
    store.options.getCellText,
  );

  store.matchedCells = matches;
  store.matchedSet = new Set(matches.map(m => makeCellKey(m.rowIdx, m.colIdx)));

  const shouldResetIndex = !preserveActiveIndex || store.activeMatchIdx < 0 || store.activeMatchIdx >= matches.length;

  if (shouldResetIndex) {
    store.activeMatchIdx = matches.length > 0 ? 0 : -1;
  }

  updateActiveMatchKey(store);
  updateGridSearch(store);
  notifyCellListeners(store);
}

function runSearch(store: GridSearchStore): void {
  updateMatches(store, false);

  if (store.activeMatchIdx >= 0) {
    scrollToActiveMatch(store);
  }
}

function debouncedSearch(store: GridSearchStore): void {
  if (store.debounceTimer !== null) {
    clearTimeout(store.debounceTimer);
  }
  store.debounceTimer = setTimeout(() => {
    if (!store.disposed) {
      runSearch(store);
    }
  }, DEFAULT_DEBOUNCE_MS);
}

function scrollToActiveMatch(store: GridSearchStore): void {
  const match = store.matchedCells[store.activeMatchIdx];
  if (match) {
    store.options.scrollToCell(match.rowIdx, match.colIdx);
  }
}

function createActions(store: GridSearchStore): IGridSearchActions {
  return {
    setQuery(value: string): void {
      if (store.query === value) {
        return;
      }
      store.query = value;
      updateGridSearch(store);
      debouncedSearch(store);
    },

    setReplace(value: string): void {
      if (store.replace === value) {
        return;
      }
      store.replace = value;
      updateGridSearch(store);
    },

    toggleCaseSensitive(): void {
      store.caseSensitive = !store.caseSensitive;
      updateGridSearch(store);
      debouncedSearch(store);
    },

    toggleWholeWord(): void {
      store.wholeWord = !store.wholeWord;
      updateGridSearch(store);
      debouncedSearch(store);
    },

    toggleRegex(): void {
      store.regexp = !store.regexp;
      updateGridSearch(store);
      debouncedSearch(store);
    },

    findNext(): void {
      if (store.matchedCells.length === 0) {
        if (store.query) {
          runSearch(store);
        }
        return;
      }
      store.activeMatchIdx = (store.activeMatchIdx + 1) % store.matchedCells.length;
      updateActiveMatchKey(store);
      updateGridSearch(store);
      notifyCellListeners(store);
      scrollToActiveMatch(store);
    },

    findPrevious(): void {
      if (store.matchedCells.length === 0) {
        if (store.query) {
          runSearch(store);
        }
        return;
      }
      store.activeMatchIdx = store.activeMatchIdx === 0 ? store.matchedCells.length - 1 : store.activeMatchIdx - 1;
      updateActiveMatchKey(store);
      updateGridSearch(store);
      notifyCellListeners(store);
      scrollToActiveMatch(store);
    },

    replaceActive(): void {
      if (store.activeMatchIdx < 0 || store.activeMatchIdx >= store.matchedCells.length) {
        return;
      }

      const match = store.matchedCells[store.activeMatchIdx];
      if (!match) {
        return;
      }

      const pattern = buildPattern(store);
      if (!pattern) {
        return;
      }

      store.options.onReplacingChange?.(true);
      try {
        const cellText = store.options.getCellText(match.rowIdx, match.colIdx);
        const { newText, stillMatches } = replaceInCell(cellText, pattern, store.replace);
        store.options.replaceCellValue(match.rowIdx, match.colIdx, newText);

        if (!stillMatches) {
          store.matchedCells.splice(store.activeMatchIdx, 1);
          store.matchedSet = new Set(store.matchedCells.map(m => makeCellKey(m.rowIdx, m.colIdx)));

          if (store.matchedCells.length === 0) {
            store.activeMatchIdx = -1;
          } else if (store.activeMatchIdx >= store.matchedCells.length) {
            store.activeMatchIdx = store.matchedCells.length - 1;
          }
        }

        updateActiveMatchKey(store);
        updateGridSearch(store);
        notifyCellListeners(store);

        if (store.activeMatchIdx >= 0) {
          scrollToActiveMatch(store);
        }
      } finally {
        store.options.onReplacingChange?.(false);
      }
    },

    replaceAll(): void {
      if (store.matchedCells.length === 0) {
        return;
      }

      const pattern = buildPattern(store);
      if (!pattern) {
        return;
      }

      store.options.onReplacingChange?.(true);
      try {
        const matches = [...store.matchedCells];
        const updates: ICellValueUpdate[] = [];

        for (const match of matches) {
          const cellText = store.options.getCellText(match.rowIdx, match.colIdx);
          const { newText } = replaceInCell(cellText, pattern, store.replace);
          updates.push({ rowIdx: match.rowIdx, colIdx: match.colIdx, value: newText });
        }

        if (store.options.replaceCellValues) {
          store.options.replaceCellValues(updates);
        } else {
          for (const update of updates) {
            store.options.replaceCellValue(update.rowIdx, update.colIdx, update.value);
          }
        }

        runSearch(store);
      } finally {
        store.options.onReplacingChange?.(false);
      }
    },

    setReplaceOpen(open: boolean): void {
      if (store.replaceOpen === open) {
        return;
      }
      store.replaceOpen = open;
      syncState(store);
    },

    refresh(): void {
      if (store.query) {
        updateMatches(store, true);
      }
    },

    close(): void {
      syncState(store);
      store.options.storage?.update({ open: false });
    },
  };
}

function createCellClassName(store: GridSearchStore): IGridReactiveValue<string | undefined, [number, number]> {
  return {
    get(rowIdx: number, colIdx: number): string | undefined {
      if (!store.query) {
        return undefined;
      }

      const key = makeCellKey(rowIdx, colIdx);
      if (!store.matchedSet.has(key)) {
        return undefined;
      }

      if (key === store.activeMatchKey) {
        return ACTIVE_CLASS;
      }

      return MATCH_CLASS;
    },
    subscribe(onChange: () => void): () => void {
      store.cellListeners.add(onChange);
      return () => {
        store.cellListeners.delete(onChange);
      };
    },
  };
}

export interface IGridSearchResult {
  snapshot: IGridSearchSnapshot;
  actions: IGridSearchActions;
  getCellClassName: IGridReactiveValue<string | undefined, [number, number]>;
  replaceOpen: boolean;
}

export function useGridSearch(options: IGridSearchOptions): IGridSearchResult {
  const [store] = useState(() => createStore(options));
  const prevRowCountRef = useRef(options.rowCount);
  const prevColCountRef = useRef(options.columnCount);
  store.options = options;

  useEffect(() => {
    // Skip initial search if cache was restored
    if (store.matchedCells.length > 0) {
      notifyCellListeners(store);
      return;
    }

    if (!store.query) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!store.disposed) {
        runSearch(store);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevRowCountRef.current !== options.rowCount || prevColCountRef.current !== options.columnCount) {
      prevRowCountRef.current = options.rowCount;
      prevColCountRef.current = options.columnCount;
      if (store.query) {
        updateMatches(store, true);
      }
    }
  }, [options.rowCount, options.columnCount, store]);

  useEffect(
    () => () => {
      store.disposed = true;
      if (store.debounceTimer !== null) {
        clearTimeout(store.debounceTimer);
      }
      store.listeners.clear();
      store.cellListeners.clear();
    },
    [store],
  );

  const subscribe = useCallback(
    (cb: () => void) => {
      store.listeners.add(cb);
      return () => {
        store.listeners.delete(cb);
      };
    },
    [store],
  );
  const getSnapshotFn = useCallback(() => getSnapshot(store), [store]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshotFn);

  const [actions] = useState(() => createActions(store));
  const [getCellClassName] = useState(() => createCellClassName(store));

  return { snapshot, actions, getCellClassName, replaceOpen: store.replaceOpen };
}
