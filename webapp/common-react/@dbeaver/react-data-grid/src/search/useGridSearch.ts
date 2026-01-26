/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import type { IGridReactiveValue } from '../IGridReactiveValue.js';
import { GridSearchEngine, type ICellMatch } from './GridSearchEngine.js';

const DEFAULT_DEBOUNCE_MS = 300;
const MATCH_CLASS = 'rdg-cell-search-match';
const ACTIVE_CLASS = 'rdg-cell-search-match rdg-cell-search-active';

export interface IGridSearchPersistence {
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
  open: boolean;
  replaceOpen: boolean;
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
  close: () => void;
}

export interface IGridSearchOptions {
  rowCount: number;
  columnCount: number;
  getCellText: (rowIdx: number, colIdx: number) => string;
  scrollToCell: (position: { rowIdx: number; colIdx: number }) => void;
  replaceCellValue: (rowIdx: number, colIdx: number, value: string) => void;
  defaultState?: IGridSearchPersistence;
  onChange?: (state: IGridSearchPersistence) => void;
  onReplacingChange?: (isReplacing: boolean) => void;
}

interface GridSearchStore {
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
  replaceOpen: boolean;
  matchedCells: ICellMatch[];
  matchedSet: Set<string>;
  activeMatchIdx: number;

  listeners: Set<() => void>;
  cellListeners: Set<() => void>;
  snapshotCache: IGridSearchSnapshot | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  disposed: boolean;

  options: IGridSearchOptions;
}

function createStore(options: IGridSearchOptions): GridSearchStore {
  return {
    query: options.defaultState?.query ?? '',
    replace: options.defaultState?.replace ?? '',
    caseSensitive: options.defaultState?.caseSensitive ?? false,
    wholeWord: options.defaultState?.wholeWord ?? false,
    regexp: options.defaultState?.regexp ?? false,
    replaceOpen: options.defaultState?.replaceOpen ?? false,
    matchedCells: [],
    matchedSet: new Set(),
    activeMatchIdx: -1,
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

function notify(store: GridSearchStore): void {
  for (const listener of store.listeners) {
    listener();
  }
  notifyChange(store);
}

function notifyCells(store: GridSearchStore): void {
  for (const listener of store.cellListeners) {
    listener();
  }
}

function notifyChange(store: GridSearchStore): void {
  store.options.onChange?.({
    query: store.query,
    replace: store.replace,
    caseSensitive: store.caseSensitive,
    wholeWord: store.wholeWord,
    regexp: store.regexp,
    open: true,
    replaceOpen: store.replaceOpen,
  });
}

function buildPattern(store: GridSearchStore): RegExp | null {
  return GridSearchEngine.buildPattern(store.query, {
    caseSensitive: store.caseSensitive,
    wholeWord: store.wholeWord,
    regexp: store.regexp,
  });
}

function runSearch(store: GridSearchStore): void {
  const matches = GridSearchEngine.search(
    store.query,
    { caseSensitive: store.caseSensitive, wholeWord: store.wholeWord, regexp: store.regexp },
    store.options.rowCount,
    store.options.columnCount,
    store.options.getCellText,
  );

  store.matchedCells = matches;
  store.matchedSet = new Set(matches.map(m => `${m.rowIdx}+${m.colIdx}`));
  store.activeMatchIdx = matches.length === 0 ? -1 : 0;

  invalidateSnapshot(store);
  notify(store);
  notifyCells(store);

  if (store.activeMatchIdx >= 0) {
    scrollToActiveMatch(store);
  }
}

function refreshMatches(store: GridSearchStore): void {
  const matches = GridSearchEngine.search(
    store.query,
    { caseSensitive: store.caseSensitive, wholeWord: store.wholeWord, regexp: store.regexp },
    store.options.rowCount,
    store.options.columnCount,
    store.options.getCellText,
  );

  if (store.activeMatchIdx >= matches.length) {
    store.activeMatchIdx = matches.length > 0 ? matches.length - 1 : -1;
  }

  store.matchedCells = matches;
  store.matchedSet = new Set(matches.map(m => `${m.rowIdx}+${m.colIdx}`));
  invalidateSnapshot(store);
  notify(store);
  notifyCells(store);
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
    store.options.scrollToCell({ rowIdx: match.rowIdx, colIdx: match.colIdx });
  }
}

function createActions(store: GridSearchStore): IGridSearchActions {
  return {
    setQuery(value: string): void {
      if (store.query === value) {
        return;
      }
      store.query = value;
      invalidateSnapshot(store);
      notify(store);
      debouncedSearch(store);
    },

    setReplace(value: string): void {
      if (store.replace === value) {
        return;
      }
      store.replace = value;
      invalidateSnapshot(store);
      notify(store);
    },

    toggleCaseSensitive(): void {
      store.caseSensitive = !store.caseSensitive;
      invalidateSnapshot(store);
      notify(store);
      debouncedSearch(store);
    },

    toggleWholeWord(): void {
      store.wholeWord = !store.wholeWord;
      invalidateSnapshot(store);
      notify(store);
      debouncedSearch(store);
    },

    toggleRegex(): void {
      store.regexp = !store.regexp;
      invalidateSnapshot(store);
      notify(store);
      debouncedSearch(store);
    },

    findNext(): void {
      if (store.matchedCells.length === 0) {
        return;
      }
      store.activeMatchIdx = (store.activeMatchIdx + 1) % store.matchedCells.length;
      invalidateSnapshot(store);
      notify(store);
      notifyCells(store);
      scrollToActiveMatch(store);
    },

    findPrevious(): void {
      if (store.matchedCells.length === 0) {
        return;
      }
      store.activeMatchIdx = store.activeMatchIdx === 0 ? store.matchedCells.length - 1 : store.activeMatchIdx - 1;
      invalidateSnapshot(store);
      notify(store);
      notifyCells(store);
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
        const { newText, stillMatches } = GridSearchEngine.replaceInCell(cellText, pattern, store.replace);
        store.options.replaceCellValue(match.rowIdx, match.colIdx, newText);

        if (!stillMatches) {
          store.matchedCells.splice(store.activeMatchIdx, 1);
          store.matchedSet = new Set(store.matchedCells.map(m => `${m.rowIdx}+${m.colIdx}`));

          if (store.matchedCells.length === 0) {
            store.activeMatchIdx = -1;
          } else if (store.activeMatchIdx >= store.matchedCells.length) {
            store.activeMatchIdx = store.matchedCells.length - 1;
          }
        }

        invalidateSnapshot(store);
        notify(store);
        notifyCells(store);

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
        for (const match of matches) {
          const cellText = store.options.getCellText(match.rowIdx, match.colIdx);
          const { newText } = GridSearchEngine.replaceInCell(cellText, pattern, store.replace);
          store.options.replaceCellValue(match.rowIdx, match.colIdx, newText);
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
      notifyChange(store);
    },

    close(): void {
      store.options.onChange?.({
        query: store.query,
        replace: store.replace,
        caseSensitive: store.caseSensitive,
        wholeWord: store.wholeWord,
        regexp: store.regexp,
        open: false,
        replaceOpen: store.replaceOpen,
      });
    },
  };
}

function createCellClassName(store: GridSearchStore): IGridReactiveValue<string | undefined, [number, number]> {
  return {
    get(rowIdx: number, colIdx: number): string | undefined {
      if (!store.query) {
        return undefined;
      }

      const key = `${rowIdx}+${colIdx}`;
      if (!store.matchedSet.has(key)) {
        return undefined;
      }

      const activeMatch = store.matchedCells[store.activeMatchIdx];
      if (activeMatch && activeMatch.rowIdx === rowIdx && activeMatch.colIdx === colIdx) {
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
  const initialSearchDone = useRef(false);

  // eslint-disable-next-line react-hooks/immutability
  store.options = options;

  if (!initialSearchDone.current && store.query) {
    initialSearchDone.current = true;
    setTimeout(() => runSearch(store), 0);
  }

  useEffect(() => {
    if (prevRowCountRef.current !== options.rowCount || prevColCountRef.current !== options.columnCount) {
      prevRowCountRef.current = options.rowCount;
      prevColCountRef.current = options.columnCount;
      if (store.query) {
        refreshMatches(store);
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
