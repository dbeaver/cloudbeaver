/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { IGridReactiveValue } from '../IGridReactiveValue.js';
import { buildSearchPattern, replaceInCell, searchGrid, type ICellMatch } from './GridSearchEngine.js';
import type { ICellChange } from '../DataGridCellContext.js';
import { makeCellKey } from './cellKey.js';
import { useTrackedGridSearchCellSubscriptions } from './useTrackedGridSearchCellSubscriptions.js';
import {
  computeActiveIdx,
  computeActiveIdxAfterRemoval,
  computeActiveMatchIdx,
  gridSearchReducer,
  type GridSearchQueryState,
  type GridSearchState,
} from './state.js';

export type { ICellMatch } from './GridSearchEngine.js';

const DEFAULT_DEBOUNCE_MS = 300;

export interface IGridSearchStorageState extends GridSearchState {
  open: boolean;
}

export interface IGridSearchSnapshot extends GridSearchQueryState {
  matchCount: number;
  activeMatchIndex: number;
}

export interface IGridSearchStorage {
  get(): IGridSearchStorageState | undefined;
  set(state: IGridSearchStorageState): void;
  update(state: Partial<IGridSearchStorageState>): void;
}

const MATCH_CLASS = 'rdg-cell-search-match';
const ACTIVE_CLASS = 'rdg-cell-search-match rdg-cell-search-active';

function scrollToMatch(scrollToCell: (rowIdx: number, colIdx: number) => void, match: ICellMatch | undefined): void {
  if (match) {
    scrollToCell(match.rowIdx, match.colIdx);
  }
}

function getNextMatchAfterRemoval(matchedCells: ICellMatch[], activeMatchIdx: number): ICellMatch | undefined {
  const nextActiveIdx = computeActiveIdxAfterRemoval(matchedCells.length - 1, activeMatchIdx);
  if (nextActiveIdx < 0) {
    return undefined;
  }

  const actualIdx = nextActiveIdx >= activeMatchIdx ? nextActiveIdx + 1 : nextActiveIdx;
  return matchedCells[actualIdx];
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

export interface IGridSearchOptions {
  rowCount: number;
  columnCount: number;
  cellText?: IGridReactiveValue<string, [rowIdx: number, colIdx: number]>;
  scrollToCell: (rowIdx: number, colIdx: number) => void;
  onReplace: (updates: ICellChange[]) => void;
  onReplacingChange?: (isReplacing: boolean) => void;
  storage?: IGridSearchStorage;
  open?: boolean;
}

export interface IGridSearchResult {
  snapshot: IGridSearchSnapshot;
  actions: IGridSearchActions;
  getCellClassName: IGridReactiveValue<string | undefined, [number, number]>;
  replaceOpen: boolean;
}

function createInitialState(options: IGridSearchOptions): GridSearchState {
  const cached = options.storage?.get();
  const hasCache = cached !== undefined && !!cached.query && cached.matchedCells.length > 0;

  return {
    query: cached?.query ?? '',
    replace: cached?.replace ?? '',
    caseSensitive: cached?.caseSensitive ?? false,
    wholeWord: cached?.wholeWord ?? false,
    regexp: cached?.regexp ?? false,
    replaceOpen: cached?.replaceOpen ?? false,
    matchedCells: hasCache ? cached!.matchedCells : [],
    activeMatchIdx: hasCache ? cached!.activeMatchIdx : -1,
  };
}

function getCellText(options: IGridSearchOptions, rowIdx: number, colIdx: number): string {
  return options.cellText?.get(rowIdx, colIdx) ?? '';
}

export function useGridSearch(options: IGridSearchOptions): IGridSearchResult {
  const [state, dispatch] = useReducer(gridSearchReducer, options, createInitialState);

  const optionsRef = useRef(options);
  const stateRef = useRef(state);

  const cellListenersRef = useRef(new Set<() => void>());
  const prevMatchedCellsRef = useRef(state.matchedCells);
  const [initialDerived] = useState(() => {
    const matchedSet = new Set(state.matchedCells.map(m => makeCellKey(m.rowIdx, m.colIdx)));
    const activeMatch = state.matchedCells[state.activeMatchIdx];
    const activeMatchKey = activeMatch ? makeCellKey(activeMatch.rowIdx, activeMatch.colIdx) : null;
    return { matchedSet, activeMatchKey };
  });
  const matchedSetRef = useRef(initialDerived.matchedSet);
  const activeMatchKeyRef = useRef(initialDerived.activeMatchKey);
  const queryRef = useRef(state.query);

  const lastGridSizeRef = useRef({ rowCount: options.rowCount, columnCount: options.columnCount });
  const isInitialMountRef = useRef(true);

  const runSearchAndScroll = useCallback((searchState: Omit<GridSearchQueryState, 'replace'>, preserveActiveIndex: boolean): void => {
    const opts = optionsRef.current;
    const currentState = stateRef.current;

    const matches = searchGrid(
      searchState.query,
      {
        caseSensitive: searchState.caseSensitive,
        wholeWord: searchState.wholeWord,
        regexp: searchState.regexp,
      },
      opts.rowCount,
      opts.columnCount,
      (rowIdx, colIdx) => getCellText(opts, rowIdx, colIdx),
    );

    dispatch({ type: 'SET_MATCHES', matchedCells: matches, preserveActiveIndex });

    const newActiveIdx = computeActiveIdx(matches, currentState.activeMatchIdx, preserveActiveIndex);
    scrollToMatch(opts.scrollToCell, matches[newActiveIdx]);
  }, []);

  const handleTrackedCellChange = useCallback((): void => {
    const st = stateRef.current;
    if (!st.query) {
      return;
    }

    runSearchAndScroll(st, true);
  }, [runSearchAndScroll]);

  const { syncGridSubscriptions, clearTrackedCellSubscriptions } = useTrackedGridSearchCellSubscriptions({
    debounceMs: DEFAULT_DEBOUNCE_MS,
    onTrackedCellChange: handleTrackedCellChange,
  });

  const actions = useMemo<IGridSearchActions>(() => {
    function runSearchNow(preserveActiveIndex: boolean): void {
      runSearchAndScroll(stateRef.current, preserveActiveIndex);
    }

    return {
      setQuery(value: string): void {
        dispatch({ type: 'SET_QUERY', query: value });
      },

      setReplace(value: string): void {
        dispatch({ type: 'SET_REPLACE', replace: value });
      },

      toggleCaseSensitive(): void {
        dispatch({ type: 'TOGGLE_CASE_SENSITIVE' });
      },

      toggleWholeWord(): void {
        dispatch({ type: 'TOGGLE_WHOLE_WORD' });
      },

      toggleRegex(): void {
        dispatch({ type: 'TOGGLE_REGEX' });
      },

      findNext(): void {
        const st = stateRef.current;
        if (st.matchedCells.length === 0) {
          if (st.query) {
            runSearchNow(false);
          }
          return;
        }
        const nextIdx = computeActiveMatchIdx(st.matchedCells.length, st.activeMatchIdx, 1);
        dispatch({ type: 'SET_ACTIVE_MATCH', index: nextIdx });
        scrollToMatch(optionsRef.current.scrollToCell, st.matchedCells[nextIdx]);
      },

      findPrevious(): void {
        const st = stateRef.current;
        if (st.matchedCells.length === 0) {
          if (st.query) {
            runSearchNow(false);
          }
          return;
        }
        const prevIdx = computeActiveMatchIdx(st.matchedCells.length, st.activeMatchIdx, -1);
        dispatch({ type: 'SET_ACTIVE_MATCH', index: prevIdx });
        scrollToMatch(optionsRef.current.scrollToCell, st.matchedCells[prevIdx]);
      },

      replaceActive(): void {
        const st = stateRef.current;
        if (st.activeMatchIdx < 0 || st.activeMatchIdx >= st.matchedCells.length) {
          return;
        }

        const match = st.matchedCells[st.activeMatchIdx];
        if (!match) {
          return;
        }

        const pattern = buildSearchPattern(st.query, {
          caseSensitive: st.caseSensitive,
          wholeWord: st.wholeWord,
          regexp: st.regexp,
        });
        if (!pattern) {
          return;
        }

        const opts = optionsRef.current;
        opts.onReplacingChange?.(true);
        try {
          const cellValue = getCellText(opts, match.rowIdx, match.colIdx);
          const { newText, stillMatches } = replaceInCell(cellValue, pattern, st.replace);
          opts.onReplace([{ rowIdx: match.rowIdx, colIdx: match.colIdx, value: newText }]);

          if (!stillMatches) {
            dispatch({ type: 'REMOVE_MATCH', index: st.activeMatchIdx });

            const nextMatch = getNextMatchAfterRemoval(st.matchedCells, st.activeMatchIdx);
            scrollToMatch(opts.scrollToCell, nextMatch);
          }
        } finally {
          opts.onReplacingChange?.(false);
        }
      },

      replaceAll(): void {
        const st = stateRef.current;
        if (st.matchedCells.length === 0) {
          return;
        }

        const pattern = buildSearchPattern(st.query, {
          caseSensitive: st.caseSensitive,
          wholeWord: st.wholeWord,
          regexp: st.regexp,
        });
        if (!pattern) {
          return;
        }

        const opts = optionsRef.current;
        opts.onReplacingChange?.(true);
        try {
          const matches = [...st.matchedCells];
          const updates = matches.map(match => {
            const cellValue = getCellText(opts, match.rowIdx, match.colIdx);
            const { newText } = replaceInCell(cellValue, pattern, st.replace);
            return { rowIdx: match.rowIdx, colIdx: match.colIdx, value: newText };
          });
          opts.onReplace(updates);
        } finally {
          opts.onReplacingChange?.(false);
        }

        runSearchNow(false);
      },

      setReplaceOpen(open: boolean): void {
        dispatch({ type: 'SET_REPLACE_OPEN', open });
      },

      refresh(): void {
        if (stateRef.current.query) {
          runSearchNow(true);
        }
      },

      close(): void {
        const opts = optionsRef.current;
        const st = stateRef.current;
        // Sync state to storage explicitly (cannot rely on effect before potential unmount)
        opts.storage?.set({
          matchedCells: st.matchedCells,
          activeMatchIdx: st.activeMatchIdx,
          query: st.query,
          replace: st.replace,
          caseSensitive: st.caseSensitive,
          wholeWord: st.wholeWord,
          regexp: st.regexp,
          replaceOpen: st.replaceOpen,
          open: false,
        });
      },
    };
  }, [runSearchAndScroll]);

  const [getCellClassName] = useState<IGridReactiveValue<string | undefined, [number, number]>>(() => ({
    get(rowIdx: number, colIdx: number): string | undefined {
      if (!queryRef.current) {
        return undefined;
      }

      const key = makeCellKey(rowIdx, colIdx);
      if (!matchedSetRef.current.has(key)) {
        return undefined;
      }

      if (key === activeMatchKeyRef.current) {
        return ACTIVE_CLASS;
      }

      return MATCH_CLASS;
    },
    subscribe(onChange: () => void): () => void {
      cellListenersRef.current.add(onChange);
      return () => {
        cellListenersRef.current.delete(onChange);
      };
    },
  }));

  // --- Sync React state → refs, notify cell listeners ---
  useEffect(() => {
    optionsRef.current = options;
    stateRef.current = state;

    // Only rebuild matchedSet when matchedCells identity changes
    if (state.matchedCells !== prevMatchedCellsRef.current) {
      matchedSetRef.current = new Set(state.matchedCells.map(m => makeCellKey(m.rowIdx, m.colIdx)));
      prevMatchedCellsRef.current = state.matchedCells;
    }

    const activeMatch = state.matchedCells[state.activeMatchIdx];
    activeMatchKeyRef.current = activeMatch ? makeCellKey(activeMatch.rowIdx, activeMatch.colIdx) : null;
    queryRef.current = state.query;

    for (const listener of cellListenersRef.current) {
      listener();
    }
  }, [options, state]);

  // --- Storage sync ---
  useEffect(() => {
    optionsRef.current.storage?.set({
      matchedCells: state.matchedCells,
      activeMatchIdx: state.activeMatchIdx,
      query: state.query,
      replace: state.replace,
      caseSensitive: state.caseSensitive,
      wholeWord: state.wholeWord,
      regexp: state.regexp,
      replaceOpen: state.replaceOpen,
      open: optionsRef.current.open ?? true,
    });
  }, [
    state.query,
    state.replace,
    state.caseSensitive,
    state.wholeWord,
    state.regexp,
    state.replaceOpen,
    state.matchedCells,
    state.activeMatchIdx,
    options.open,
  ]);

  // --- Debounced search (reacts to query/flag changes) ---
  useEffect(() => {
    if (!state.query) {
      clearTrackedCellSubscriptions();
      return;
    }

    syncGridSubscriptions(options.cellText, options.rowCount, options.columnCount);
  }, [state.query, options.cellText, options.rowCount, options.columnCount, syncGridSubscriptions, clearTrackedCellSubscriptions]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (!state.query) {
      clearTrackedCellSubscriptions();
      return;
    }

    const searchState = {
      query: state.query,
      caseSensitive: state.caseSensitive,
      wholeWord: state.wholeWord,
      regexp: state.regexp,
    };

    const timeoutId = setTimeout(() => {
      runSearchAndScroll(searchState, false);
    }, DEFAULT_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [state.query, state.caseSensitive, state.wholeWord, state.regexp, runSearchAndScroll, clearTrackedCellSubscriptions]);

  // --- Re-search when grid size changes ---
  useEffect(() => {
    if (lastGridSizeRef.current.rowCount !== options.rowCount || lastGridSizeRef.current.columnCount !== options.columnCount) {
      lastGridSizeRef.current = { rowCount: options.rowCount, columnCount: options.columnCount };
      actions.refresh();
    }
  }, [options.rowCount, options.columnCount, actions]);

  // --- Initial search on mount ---
  useEffect(() => {
    const st = stateRef.current;

    // Cache was restored with matches — cell listeners will be notified by the state→ref sync effect
    if (st.matchedCells.length > 0) {
      return;
    }

    if (!st.query) {
      return;
    }

    actions.refresh();
  }, [actions]);

  // --- Cleanup ---
  useEffect(
    () => () => {
      cellListenersRef.current.clear();
    },
    [],
  );

  const snapshot = useMemo<IGridSearchSnapshot>(
    () => ({
      query: state.query,
      replace: state.replace,
      caseSensitive: state.caseSensitive,
      wholeWord: state.wholeWord,
      regexp: state.regexp,
      matchCount: state.matchedCells.length,
      activeMatchIndex: state.activeMatchIdx,
    }),
    [state.query, state.replace, state.caseSensitive, state.wholeWord, state.regexp, state.matchedCells, state.activeMatchIdx],
  );

  return { snapshot, actions, getCellClassName, replaceOpen: state.replaceOpen };
}
