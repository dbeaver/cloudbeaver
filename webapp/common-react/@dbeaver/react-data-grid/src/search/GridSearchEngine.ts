/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ISearchPatternOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
}

export interface ICellMatch {
  rowIdx: number;
  colIdx: number;
}

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

export class GridSearchEngine {
  /** Build regex from query string + flags. Returns null for empty/invalid input. */
  static buildPattern(query: string, options: ISearchPatternOptions): RegExp | null {
    if (!query) {
      return null;
    }

    try {
      if (options.regexp) {
        const flags = options.caseSensitive ? 'g' : 'gi';
        return new RegExp(query, flags);
      }

      let escapedSearch = query.replace(ESCAPE_REGEX, '\\$&');
      if (options.wholeWord) {
        escapedSearch = `\\b${escapedSearch}\\b`;
      }

      const flags = options.caseSensitive ? 'g' : 'gi';
      return new RegExp(escapedSearch, flags);
    } catch {
      return null;
    }
  }

  /** Iterate all cells, return matches. O(rows * cols). */
  static search(
    query: string,
    options: ISearchPatternOptions,
    rowCount: number,
    columnCount: number,
    getCellText: (rowIdx: number, colIdx: number) => string,
  ): ICellMatch[] {
    const searchPattern = GridSearchEngine.buildPattern(query, options);

    if (!searchPattern) {
      return [];
    }

    const matches: ICellMatch[] = [];

    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
      for (let colIdx = 0; colIdx < columnCount; colIdx++) {
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

  /** Replace pattern in cell text. Returns new text and whether pattern still matches. */
  static replaceInCell(cellText: string, pattern: RegExp, replaceValue: string): { newText: string; stillMatches: boolean } {
    const newText = cellText.replace(pattern, replaceValue);

    if (pattern.global) {
      pattern.lastIndex = 0;
    }

    const stillMatches = pattern.test(newText);
    if (pattern.global) {
      pattern.lastIndex = 0;
    }

    return { newText, stillMatches };
  }
}
