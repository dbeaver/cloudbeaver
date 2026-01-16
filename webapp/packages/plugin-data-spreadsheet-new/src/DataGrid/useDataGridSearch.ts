/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { useLayoutEffect, useMemo, type RefObject } from 'react';

import { useUserData } from '@cloudbeaver/core-blocks';
import type { DataGridRef } from '@cloudbeaver/plugin-data-grid';

export interface IDataViewerSearchMatches {
  count: number;
  current: number;
}

export interface IDataViewerSearchQuery {
  search: string;
  replace?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regexp?: boolean;
}

export interface IDataGridSearchState {
  query: IDataViewerSearchQuery;
  matches: IDataViewerSearchMatches;
  open: boolean;
  setTableData: (
    getData: () => {
      rows: any[];
      columns: any[];
      getCellText: (rowIdx: number, colIdx: number) => string;
    },
  ) => void;
  setGridRef: (ref: RefObject<DataGridRef | null>) => void;
  setQuery: (search: string) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleRegex: () => void;
  findNext: () => void;
  findPrevious: () => void;
  openSearch: (callback?: () => void) => void;
  close: () => void;
  isMatch: (rowIdx: number, colIdx: number) => boolean;
  isActiveMatch: (rowIdx: number, colIdx: number) => boolean;
}

interface IDataGridSearchPersistent {
  query: {
    search: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regexp: boolean;
  };
  open: boolean;
}

interface IDataGridSearchStateInternal extends IDataGridSearchState {
  tableData:
    | (() => {
        rows: any[];
        columns: any[];
        getCellText: (rowIdx: number, colIdx: number) => string;
      })
    | null;
  gridRef: RefObject<DataGridRef | null> | null;
  matchedCells: Array<{ rowIdx: number; colIdx: number }>;
  activeMatchIdx: number;
  runSearch: () => void;
  scrollToActiveMatch: () => void;
}

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

//TODO:
// 1. Optimize search for large datasets (add limit, debounce, web worker, etc.)
// 2. Think about persisted artifact lifecycle (when and how to clean up)
// 3. Editions while searching
class DataGridSearchStore implements IDataGridSearchStateInternal {
  query: IDataViewerSearchQuery;
  open = false;
  tableData:
    | (() => {
        rows: any[];
        columns: any[];
        getCellText: (rowIdx: number, colIdx: number) => string;
      })
    | null = null;
  gridRef: RefObject<DataGridRef | null> | null = null;
  matchedCells: Array<{ rowIdx: number; colIdx: number }> = [];
  activeMatchIdx = -1;

  get matches(): IDataViewerSearchMatches {
    return {
      count: this.matchedCells.length,
      current: this.activeMatchIdx >= 0 ? this.activeMatchIdx + 1 : 0,
    };
  }

  private persisted: IDataGridSearchPersistent;
  private tableReactionDisposer: (() => void) | null = null;

  constructor(persisted: IDataGridSearchPersistent) {
    this.persisted = persisted;
    this.query = { ...persisted.query };
    this.open = persisted.open;

    makeObservable<this, 'tableReactionDisposer'>(this, {
      query: observable.ref,
      open: observable,
      tableData: observable.ref,
      gridRef: observable.ref,
      matchedCells: observable.ref,
      activeMatchIdx: observable,
      matches: computed,
      setTableData: action.bound,
      setGridRef: action.bound,
      setQuery: action.bound,
      toggleCaseSensitive: action.bound,
      toggleWholeWord: action.bound,
      toggleRegex: action.bound,
      findNext: action.bound,
      findPrevious: action.bound,
      openSearch: action.bound,
      close: action.bound,
      runSearch: action.bound,
      scrollToActiveMatch: action.bound,
      tableReactionDisposer: observable.ref,
    });

    reaction(
      () => this.query,
      query => {
        this.persisted.query = {
          search: query.search ?? '',
          caseSensitive: !!query.caseSensitive,
          wholeWord: !!query.wholeWord,
          regexp: !!query.regexp,
        };
      },
    );

    reaction(
      () => this.open,
      open => {
        this.persisted.open = open;
      },
    );
  }

  attachPersistence(persisted: IDataGridSearchPersistent) {
    this.persisted = persisted;
    this.query = { ...persisted.query };
    this.open = persisted.open;
    this.runSearch();
  }

  setTableData(
    getData: () => {
      rows: any[];
      columns: any[];
      getCellText: (rowIdx: number, colIdx: number) => string;
    },
  ) {
    this.tableData = getData;
    this.tableReactionDisposer?.();
    this.tableReactionDisposer = reaction(
      () => {
        const { rows, columns } = getData();
        return [rows.length, columns.length];
      },
      () => {
        this.refreshMatches();
      },
      { fireImmediately: true },
    );
  }

  setGridRef(ref: RefObject<DataGridRef | null>) {
    this.gridRef = ref;
  }

  private buildSearchPattern(): RegExp {
    if (this.query.regexp) {
      const flags = this.query.caseSensitive ? 'g' : 'gi';
      return new RegExp(this.query.search, flags);
    }

    let escapedSearch = this.query.search.replace(ESCAPE_REGEX, '\\$&');
    if (this.query.wholeWord) {
      escapedSearch = `\\b${escapedSearch}\\b`;
    }

    const flags = this.query.caseSensitive ? 'g' : 'gi';
    return new RegExp(escapedSearch, flags);
  }

  private performSearch(): Array<{ rowIdx: number; colIdx: number }> {
    if (!this.tableData || !this.query.search) {
      return [];
    }

    const { rows, columns, getCellText } = this.tableData();
    const searchPattern = this.buildSearchPattern();
    const matches: Array<{ rowIdx: number; colIdx: number }> = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const cellText = getCellText(rowIdx, colIdx);
        if (searchPattern.test(cellText)) {
          matches.push({ rowIdx, colIdx });
          if (searchPattern.global) {
            searchPattern.lastIndex = 0;
          }
        }
      }
    }

    return matches;
  }

  runSearch() {
    const matches = this.performSearch();
    this.matchedCells = matches;
    this.activeMatchIdx = matches.length > 0 ? 0 : -1;
    if (matches.length > 0) {
      this.scrollToActiveMatch();
    }
  }

  private refreshMatches() {
    const matches = this.performSearch();
    if (this.activeMatchIdx >= matches.length) {
      this.activeMatchIdx = matches.length > 0 ? matches.length - 1 : -1;
    }
    this.matchedCells = matches;
  }

  scrollToActiveMatch() {
    if (!this.gridRef?.current || this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return;
    }

    const match = this.matchedCells[this.activeMatchIdx];
    if (match) {
      this.gridRef.current.scrollToDataCell({ rowIdx: match.rowIdx, colIdx: match.colIdx });
    }
  }

  setQuery(search: string) {
    this.query = { ...this.query, search };
    this.runSearch();
  }

  toggleCaseSensitive() {
    this.query = { ...this.query, caseSensitive: !this.query.caseSensitive };
    this.runSearch();
  }

  toggleWholeWord() {
    this.query = { ...this.query, wholeWord: !this.query.wholeWord };
    this.runSearch();
  }

  toggleRegex() {
    this.query = { ...this.query, regexp: !this.query.regexp };
    this.runSearch();
  }

  findNext() {
    if (this.matchedCells.length === 0) {
      return;
    }

    this.activeMatchIdx = (this.activeMatchIdx + 1) % this.matchedCells.length;
    this.scrollToActiveMatch();
  }

  findPrevious() {
    if (this.matchedCells.length === 0) {
      return;
    }

    this.activeMatchIdx = this.activeMatchIdx === 0 ? this.matchedCells.length - 1 : this.activeMatchIdx - 1;
    this.scrollToActiveMatch();
  }

  openSearch(callback?: () => void) {
    this.open = true;
    if (callback) {
      setTimeout(callback, 0);
    }
  }

  close() {
    this.open = false;
    this.query = { ...this.query, search: '' };
    this.matchedCells = [];
    this.activeMatchIdx = -1;
  }

  isMatch(rowIdx: number, colIdx: number) {
    return this.matchedCells.some(match => match.rowIdx === rowIdx && match.colIdx === colIdx);
  }

  isActiveMatch(rowIdx: number, colIdx: number) {
    if (this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return false;
    }

    const activeMatch = this.matchedCells[this.activeMatchIdx];
    return activeMatch?.rowIdx === rowIdx && activeMatch?.colIdx === colIdx;
  }
}

const dataGridSearchStoreCache = new Map<string, DataGridSearchStore>();

export function useDataGridSearch(modelId: string, resultIndex: number): IDataGridSearchState {
  const key = `data-grid-search-${modelId}-${resultIndex}`;

  const persisted = useUserData<IDataGridSearchPersistent>(key, () => ({
    query: {
      search: '',
      caseSensitive: false,
      wholeWord: false,
      regexp: false,
    },
    open: false,
  }));

  const store = useMemo(() => {
    let cached = dataGridSearchStoreCache.get(key);
    if (!cached) {
      cached = new DataGridSearchStore(persisted);
      dataGridSearchStoreCache.set(key, cached);
    }
    return cached;
  }, [key, persisted]);

  useLayoutEffect(() => {
    store.attachPersistence(persisted);
  }, [store, persisted]);

  return store;
}
