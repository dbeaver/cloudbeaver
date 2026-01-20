/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DataGridRef } from '@cloudbeaver/plugin-data-grid';
import { makeObservable, observable, computed, action, reaction } from 'mobx';
import type { RefObject } from 'react';
import type { IDataGridSearchPersistent } from '../DataGridSearchStateService.js';

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
  replaceOpen: boolean;
  /** When true, editors should avoid changing grid selection/focus (used during replace). */
  suppressEditorSelection?: boolean;
  setTableData: (
    getData: () => {
      rows: any[];
      columns: any[];
      getCellText: (rowIdx: number, colIdx: number) => string;
    },
  ) => void;
  setGridRef: (ref: RefObject<DataGridRef | null>) => void;
  setQuery: (search: string) => void;
  setReplace: (replace: string) => void;
  setReplaceHandler: (fn: (rowIdx: number, colIdx: number, value: string) => void) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleRegex: () => void;
  findNext: () => void;
  findPrevious: () => void;
  openSearch: (callback?: () => void) => void;
  close: () => void;
  setReplaceOpen: (open: boolean) => void;
  isMatch: (rowIdx: number, colIdx: number) => boolean;
  isActiveMatch: (rowIdx: number, colIdx: number) => boolean;
  replaceActive: () => void;
  replaceAll: () => void;
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


export class DataGridSearchStore implements IDataGridSearchStateInternal {
  query: IDataViewerSearchQuery;
  open = false;
  replaceOpen = false;
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
  replaceHandler: ((rowIdx: number, colIdx: number, value: string) => void) | null = null;
  suppressEditorSelection = false;

  get matches(): IDataViewerSearchMatches {
    return {
      count: this.matchedCells.length,
      current: this.activeMatchIdx >= 0 ? this.activeMatchIdx + 1 : 0,
    };
  }

  private persisted: IDataGridSearchPersistent;
  private tableReactionDisposer: (() => void) | null = null;
  private pendingActiveMatchIdx: number | undefined = undefined;
  private reactionDisposers: Array<() => void> = [];

  constructor(persisted: IDataGridSearchPersistent) {
    this.persisted = persisted;
    this.query = { ...persisted.query };
    this.open = persisted.open;
    this.replaceOpen = persisted.replaceOpen;

    makeObservable<this, 'tableReactionDisposer' | 'replaceHandler' | 'suppressEditorSelection'>(this, {
      query: observable,
      open: observable,
      replaceOpen: observable,
      tableData: observable.ref,
      gridRef: observable.ref,
      matchedCells: observable.shallow,
      activeMatchIdx: observable,
      matches: computed,
      setTableData: action.bound,
      setGridRef: action.bound,
      setReplaceHandler: action.bound,
      setReplace: action.bound,
      setQuery: action.bound,
      toggleCaseSensitive: action.bound,
      toggleWholeWord: action.bound,
      toggleRegex: action.bound,
      findNext: action.bound,
      findPrevious: action.bound,
      replaceActive: action.bound,
      replaceAll: action.bound,
      openSearch: action.bound,
      close: action.bound,
      runSearch: action.bound,
      scrollToActiveMatch: action.bound,
      setReplaceOpen: action.bound,
      tableReactionDisposer: observable.ref,
      replaceHandler: observable.ref,
      suppressEditorSelection: observable,
    });

    this.reactionDisposers.push(
      reaction(
        () => [this.query.search, this.query.replace ?? '', this.query.caseSensitive, this.query.wholeWord, this.query.regexp],
        ([search, replace, caseSensitive, wholeWord, regexp]) => {
          this.persisted.query = {
            search: typeof search === 'string' ? search : '',
            replace: typeof replace === 'string' ? replace : '',
            caseSensitive: !!caseSensitive,
            wholeWord: !!wholeWord,
            regexp: !!regexp,
          };
          this.runSearch();
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.open,
        open => {
          this.persisted.open = open;
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.replaceOpen,
        replaceOpen => {
          this.persisted.replaceOpen = replaceOpen;
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.activeMatchIdx,
        idx => {
          this.persisted.activeMatchIdx = idx;
        },
      ),
    );
  }

  attachPersistence(persisted: IDataGridSearchPersistent): void {
    this.persisted = persisted;
    this.query = { ...persisted.query };
    this.open = persisted.open;
    this.replaceOpen = persisted.replaceOpen;
    this.pendingActiveMatchIdx = persisted.activeMatchIdx >= 0 ? persisted.activeMatchIdx : undefined;
    this.runSearch();
  }

  setTableData(
    getData: () => {
      rows: any[];
      columns: any[];
      getCellText: (rowIdx: number, colIdx: number) => string;
    },
  ): void {
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

  dispose(): void {
    this.tableReactionDisposer?.();
    this.tableReactionDisposer = null;
    
    for (const disposer of this.reactionDisposers) {
      disposer();
    }
    this.reactionDisposers = [];
    
    this.suppressEditorSelection = false;
    this.matchedCells = [];
    this.tableData = null;
    this.gridRef = null;
    this.replaceHandler = null;
  }

  setGridRef(ref: RefObject<DataGridRef | null>): void {
    this.gridRef = ref;
  }

  setReplaceHandler(fn: (rowIdx: number, colIdx: number, value: string) => void): void {
    this.replaceHandler = fn;
  }

  setReplaceOpen(open: boolean): void {
    this.replaceOpen = open;
  }

  setReplace(replace: string): void {
    this.query = { ...this.query, replace };
  }

  private buildSearchPattern(): RegExp | null {
    if (!this.query.search) {
      return null;
    }

    try {
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
    } catch {
      return null;
    }
  }

  private performSearch(): Array<{ rowIdx: number; colIdx: number }> {
    if (!this.tableData || !this.query.search) {
      return [];
    }

    const { rows, columns, getCellText } = this.tableData();
    const searchPattern = this.buildSearchPattern();
    
    if (!searchPattern) {
      return [];
    }

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

  runSearch(): void {
    const matches = this.performSearch();
    this.matchedCells = matches;

    if (matches.length === 0) {
      this.activeMatchIdx = -1;
    } else {
      this.activeMatchIdx = 0;
    }

    this.applyPendingActiveMatch();

    if (this.activeMatchIdx >= 0) {
      this.scrollToActiveMatch();
    }
  }

  private refreshMatches() {
    const matches = this.performSearch();
    if (this.activeMatchIdx >= matches.length) {
      this.activeMatchIdx = matches.length > 0 ? matches.length - 1 : -1;
    }
    this.matchedCells = matches;

    if (this.applyPendingActiveMatch() && this.activeMatchIdx >= 0) {
      this.scrollToActiveMatch();
    }
  }

  private applyPendingActiveMatch(): boolean {
    if (this.pendingActiveMatchIdx === undefined) {
      return false;
    }

    const desiredIdx = this.pendingActiveMatchIdx;
    this.pendingActiveMatchIdx = undefined;

    if (this.matchedCells.length === 0) {
      this.activeMatchIdx = -1;
      return false;
    }

    if (desiredIdx >= 0 && desiredIdx < this.matchedCells.length) {
      this.activeMatchIdx = desiredIdx;
    } else {
      this.activeMatchIdx = this.matchedCells.length - 1;
    }

    return true;
  }

  scrollToActiveMatch(): void {
    if (!this.gridRef?.current || this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return;
    }

    const match = this.matchedCells[this.activeMatchIdx];
    if (match) {
      this.gridRef.current.scrollToDataCell({ rowIdx: match.rowIdx, colIdx: match.colIdx });
    }
  }

  setQuery(search: string): void {
    this.query = { ...this.query, search };
  }

  toggleCaseSensitive(): void {
    this.query = { ...this.query, caseSensitive: !this.query.caseSensitive };
  }

  toggleWholeWord(): void {
    this.query = { ...this.query, wholeWord: !this.query.wholeWord };
  }

  toggleRegex(): void {
    this.query = { ...this.query, regexp: !this.query.regexp };
  }

  findNext(): void {
    if (this.matchedCells.length === 0) {
      return;
    }

    this.activeMatchIdx = (this.activeMatchIdx + 1) % this.matchedCells.length;
    this.scrollToActiveMatch();
  }

  findPrevious(): void {
    if (this.matchedCells.length === 0) {
      return;
    }

    this.activeMatchIdx = this.activeMatchIdx === 0 ? this.matchedCells.length - 1 : this.activeMatchIdx - 1;
    this.scrollToActiveMatch();
  }

  replaceActive(): void {
    if (this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return;
    }

    const match = this.matchedCells[this.activeMatchIdx];
    if (!match || !this.replaceHandler || !this.tableData) {
      return;
    }

    const value = this.query.replace ?? '';
    const searchPattern = this.buildSearchPattern();
    
    if (!searchPattern) {
      return;
    }
    
    const stillMatches = this.replaceCell(match, searchPattern, value, true);
    
    if (stillMatches === undefined) {
      return;
    }

    if (!stillMatches) {
      this.matchedCells.splice(this.activeMatchIdx, 1);

      if (this.matchedCells.length === 0) {
        this.activeMatchIdx = -1;
      } else if (this.activeMatchIdx >= this.matchedCells.length) {
        this.activeMatchIdx = this.matchedCells.length - 1;
      }

      if (this.activeMatchIdx >= 0) {
        this.scrollToActiveMatch();
      }
    } else {
      this.scrollToActiveMatch();
    }
  }

  replaceAll(): void {
    const matches = [...this.matchedCells];
    if (!this.replaceHandler || !this.tableData || matches.length === 0) {
      return;
    }

    const value = this.query.replace ?? '';
    const searchPattern = this.buildSearchPattern();
    
    if (!searchPattern) {
      return;
    }

    for (const match of matches) {
      this.replaceCell(match, searchPattern, value);
    }
    
    this.runSearch();
  }

  private replaceCell(
    match: { rowIdx: number; colIdx: number },
    searchPattern: RegExp | null,
    replaceValue: string,
    checkStillMatches = false,
  ): boolean | undefined {
    if (!this.tableData || !this.replaceHandler || !searchPattern) {
      return undefined;
    }

    this.suppressEditorSelection = true;
    
    try {
      const { getCellText } = this.tableData();
      const cellText = getCellText(match.rowIdx, match.colIdx);
      const newText = cellText.replace(searchPattern, replaceValue);
      this.replaceHandler(match.rowIdx, match.colIdx, newText);

      if (searchPattern.global) {
        searchPattern.lastIndex = 0;
      }

      if (!checkStillMatches) {
        return undefined;
      }

      const stillMatches = searchPattern.test(newText);
      if (searchPattern.global) {
        searchPattern.lastIndex = 0;
      }

      return stillMatches;
    } finally {
      this.suppressEditorSelection = false;
    }
  }

  openSearch(callback?: () => void): void {
    this.open = true;
    if (callback) {
      setTimeout(callback, 0);
    }
  }

  close(): void {
    this.open = false;
    this.query.search = '';
    this.matchedCells = [];
    this.activeMatchIdx = -1;
  }

  isMatch(rowIdx: number, colIdx: number): boolean {
    return this.matchedCells.some(match => match.rowIdx === rowIdx && match.colIdx === colIdx);
  }

  isActiveMatch(rowIdx: number, colIdx: number): boolean {
    if (this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return false;
    }

    const activeMatch = this.matchedCells[this.activeMatchIdx];
    return activeMatch?.rowIdx === rowIdx && activeMatch?.colIdx === colIdx;
  }
}