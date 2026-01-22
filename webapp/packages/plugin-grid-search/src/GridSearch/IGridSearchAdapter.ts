/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IGridSearchAdapter {
  getRowCount: () => number;
  getColumnCount: () => number;
  getCellText: (rowIdx: number, colIdx: number) => string;
  setCellValue?: (rowIdx: number, colIdx: number, value: string) => void;
}
export interface IGridScrollController {
  scrollToCell: (position: { rowIdx: number; colIdx: number }) => void;
}

export interface IGridSearchQuery {
  search: string;
  replace?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regexp?: boolean;
}
export interface IGridSearchMatches {
  count: number;
  current: number;
}

export interface IGridSearchState {
  query: IGridSearchQuery;
  matches: IGridSearchMatches;
  open: boolean;
  replaceOpen: boolean;
  suppressEditorSelection?: boolean;

  setQuery: (search: string) => void;
  setReplace: (replace: string) => void;
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
  /** Get CSS class names for cell based on search state (for highlighting) */
  getCellClassName: (rowIdx: number, colIdx: number) => string | undefined;
}

export interface IGridSearchContext {
  suppressEditorSelection?: boolean;
}
