/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable, computed, action, reaction } from 'mobx';

import { debounce } from '@cloudbeaver/core-utils';
import { clsx } from '@dbeaver/ui-kit';

import type {
  IGridSearchAdapter,
  IGridScrollController,
  IGridSearchQuery,
  IGridSearchMatches,
  IGridSearchState,
} from './IGridSearchAdapter.js';

export interface IGridSearchCache {
  query: {
    search: string;
    replace: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regexp: boolean;
  };
  open: boolean;
  replaceOpen: boolean;
  activeMatchIdx: number;
}

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const SEARCH_DEBOUNCE_MS = 300;

export function createDefaultSearchCache(): IGridSearchCache {
  return {
    query: {
      search: '',
      replace: '',
      caseSensitive: false,
      wholeWord: false,
      regexp: false,
    },
    open: false,
    replaceOpen: false,
    activeMatchIdx: -1,
  };
}

export class GridSearchStore implements IGridSearchState {
  query: IGridSearchQuery;
  open = false;
  replaceOpen = false;
  suppressEditorSelection = false;

  private adapter: IGridSearchAdapter | null = null;
  private scrollController: IGridScrollController | null = null;
  private matchedCells: Array<{ rowIdx: number; colIdx: number }> = [];
  private activeMatchIdx = -1;
  private cache: IGridSearchCache;
  private adapterReactionDisposer: (() => void) | null = null;
  private pendingActiveMatchIdx: number | undefined = undefined;
  private reactionDisposers: Array<() => void> = [];
  private debouncedSearch: () => void;

  get matches(): IGridSearchMatches {
    return {
      count: this.matchedCells.length,
      current: this.activeMatchIdx >= 0 ? this.activeMatchIdx + 1 : 0,
    };
  }

  get matchedSet(): Set<string> {
    return new Set(this.matchedCells.map(m => this.makeCellKey(m.rowIdx, m.colIdx)));
  }

  constructor(cache: IGridSearchCache) {
    this.cache = cache;
    this.query = { ...cache.query };
    this.open = cache.open;
    this.replaceOpen = cache.replaceOpen;
    this.pendingActiveMatchIdx = cache.activeMatchIdx >= 0 ? cache.activeMatchIdx : undefined;
    this.debouncedSearch = debounce(() => {
      this.runSearch();
    }, SEARCH_DEBOUNCE_MS);

    makeObservable<this, 'adapter' | 'scrollController' | 'matchedCells' | 'activeMatchIdx' | 'adapterReactionDisposer' | 'suppressEditorSelection'>(
      this,
      {
        query: observable,
        open: observable,
        replaceOpen: observable,
        adapter: observable.ref,
        scrollController: observable.ref,
        matchedCells: observable.shallow,
        activeMatchIdx: observable,
        matches: computed,
        matchedSet: computed,
        setAdapter: action.bound,
        setScrollController: action.bound,
        setQuery: action.bound,
        setReplace: action.bound,
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
        adapterReactionDisposer: observable.ref,
        suppressEditorSelection: observable,
      },
    );

    this.reactionDisposers.push(
      reaction(
        () => [this.query.search, this.query.caseSensitive, this.query.wholeWord, this.query.regexp],
        ([search, caseSensitive, wholeWord, regexp]) => {
          this.cache.query = {
            search: typeof search === 'string' ? search : '',
            replace: this.query.replace ?? '',
            caseSensitive: !!caseSensitive,
            wholeWord: !!wholeWord,
            regexp: !!regexp,
          };
          if (this.adapter) {
            this.debouncedSearch();
          }
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.query.replace ?? '',
        replace => {
          this.cache.query = {
            ...this.cache.query,
            replace: typeof replace === 'string' ? replace : '',
          };
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.open,
        open => {
          this.cache.open = open;
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.replaceOpen,
        replaceOpen => {
          this.cache.replaceOpen = replaceOpen;
        },
      ),
    );

    this.reactionDisposers.push(
      reaction(
        () => this.activeMatchIdx,
        idx => {
          this.cache.activeMatchIdx = idx;
        },
      ),
    );

    if (this.pendingActiveMatchIdx !== undefined) {
      this.runSearch();
    }
  }

  private makeCellKey(rowIdx: number, colIdx: number): string {
    return `${rowIdx}+${colIdx}`;
  }

  setAdapter(adapter: IGridSearchAdapter | null): void {
    this.adapter = adapter;
    this.adapterReactionDisposer?.();

    if (!adapter) {
      this.adapterReactionDisposer = null;
      return;
    }

    this.adapterReactionDisposer = reaction(
      () => [adapter.getRowCount(), adapter.getColumnCount()],
      () => {
        this.refreshMatches();
      },
      { fireImmediately: true },
    );
  }

  setScrollController(controller: IGridScrollController | null): void {
    this.scrollController = controller;
  }

  dispose(): void {
    this.adapterReactionDisposer?.();
    this.adapterReactionDisposer = null;

    for (const disposer of this.reactionDisposers) {
      disposer();
    }
    this.reactionDisposers = [];

    this.suppressEditorSelection = false;
    this.matchedCells = [];
    this.adapter = null;
    this.scrollController = null;
  }

  setReplaceOpen(open: boolean): void {
    this.replaceOpen = open;
  }

  setReplace(replace: string): void {
    this.query = { ...this.query, replace };
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
    return this.matchedSet.has(this.makeCellKey(rowIdx, colIdx));
  }

  isActiveMatch(rowIdx: number, colIdx: number): boolean {
    if (this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return false;
    }

    const activeMatch = this.matchedCells[this.activeMatchIdx];
    return activeMatch?.rowIdx === rowIdx && activeMatch?.colIdx === colIdx;
  }

  getCellClassName(rowIdx: number, colIdx: number): string | undefined {
    if (!this.query?.search) {
      return undefined;
    }

    const isMatch = this.isMatch(rowIdx, colIdx);
    const isActive = this.isActiveMatch(rowIdx, colIdx);

    if (!isMatch) {
      return undefined;
    }

    const className = clsx('rdg-cell-search-match', isActive && 'rdg-cell-search-active');
    return className;
  }

  replaceActive(): void {
    if (this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return;
    }

    const match = this.matchedCells[this.activeMatchIdx];
    if (!match || !this.adapter?.setCellValue) {
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
    if (!this.adapter?.setCellValue || matches.length === 0) {
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

  scrollToActiveMatch(): void {
    if (!this.scrollController || this.activeMatchIdx < 0 || this.activeMatchIdx >= this.matchedCells.length) {
      return;
    }

    const match = this.matchedCells[this.activeMatchIdx];
    if (match) {
      this.scrollController.scrollToCell({ rowIdx: match.rowIdx, colIdx: match.colIdx });
    }
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
    if (!this.adapter || !this.query.search) {
      return [];
    }

    const rowCount = this.adapter.getRowCount();
    const columnCount = this.adapter.getColumnCount();
    const searchPattern = this.buildSearchPattern();

    if (!searchPattern) {
      return [];
    }

    const matches: Array<{ rowIdx: number; colIdx: number }> = [];

    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
      for (let colIdx = 0; colIdx < columnCount; colIdx++) {
        const cellText = this.adapter.getCellText(rowIdx, colIdx);
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

  private replaceCell(
    match: { rowIdx: number; colIdx: number },
    searchPattern: RegExp | null,
    replaceValue: string,
    checkStillMatches = false,
  ): boolean | undefined {
    if (!this.adapter?.setCellValue || !searchPattern) {
      return undefined;
    }

    this.suppressEditorSelection = true;

    try {
      const cellText = this.adapter.getCellText(match.rowIdx, match.colIdx);
      const newText = cellText.replace(searchPattern, replaceValue);
      this.adapter.setCellValue(match.rowIdx, match.colIdx, newText);

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
}
