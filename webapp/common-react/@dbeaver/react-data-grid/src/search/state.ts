/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ICellMatch } from './GridSearchEngine.js';

export interface GridSearchQueryState {
  query: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
}

export interface GridSearchMatchState {
  matchedCells: ICellMatch[];
  activeMatchIdx: number;
}

export interface GridSearchUiState {
  replaceOpen: boolean;
}

export interface GridSearchState extends GridSearchMatchState, GridSearchQueryState, GridSearchUiState { }

export type GridSearchReducerAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_REPLACE'; replace: string }
  | { type: 'TOGGLE_CASE_SENSITIVE' }
  | { type: 'TOGGLE_WHOLE_WORD' }
  | { type: 'TOGGLE_REGEX' }
  | { type: 'SET_MATCHES'; matchedCells: ICellMatch[]; preserveActiveIndex: boolean }
  | { type: 'SET_ACTIVE_MATCH'; index: number }
  | { type: 'REMOVE_MATCH'; index: number }
  | { type: 'SET_REPLACE_OPEN'; open: boolean };

export function computeActiveIdx(matchedCells: ICellMatch[], currentIdx: number, preserve: boolean): number {
  if (preserve && currentIdx >= 0 && currentIdx < matchedCells.length) {
    return currentIdx;
  }
  return matchedCells.length > 0 ? 0 : -1;
}

export function computeActiveIdxAfterRemoval(matchCount: number, activeMatchIdx: number): number {
  if (matchCount === 0) {
    return -1;
  }

  return Math.max(0, Math.min(activeMatchIdx, matchCount - 1));
}

export function computeActiveMatchIdx(matchCount: number, activeMatchIdx: number, offset = 0): number {
  if (matchCount === 0) {
    return -1;
  }

  if (activeMatchIdx < 0 || activeMatchIdx >= matchCount) {
    return offset >= 0 ? 0 : matchCount - 1;
  }

  const shifted = activeMatchIdx + offset;
  return ((shifted % matchCount) + matchCount) % matchCount;
}

function areMatchesEqual(left: ICellMatch[], right: ICellMatch[]): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  if (left.some((left, i) => left.rowIdx !== right[i]!.rowIdx || left.colIdx !== right[i]!.colIdx)) {
    return false;
  }

  return true;
}

export function gridSearchReducer(state: GridSearchState, action: GridSearchReducerAction): GridSearchState {
  switch (action.type) {
    case 'SET_QUERY': {
      if (state.query === action.query) {
        return state;
      }

      if (!action.query) {
        if (state.matchedCells.length === 0 && state.activeMatchIdx === -1) {
          return { ...state, query: action.query };
        }

        return {
          ...state,
          query: action.query,
          matchedCells: [],
          activeMatchIdx: -1,
        };
      }

      return { ...state, query: action.query };
    }
    case 'SET_REPLACE': {
      if (state.replace === action.replace) {
        return state;
      }
      return { ...state, replace: action.replace };
    }
    case 'TOGGLE_CASE_SENSITIVE':
      return { ...state, caseSensitive: !state.caseSensitive };
    case 'TOGGLE_WHOLE_WORD':
      return { ...state, wholeWord: !state.wholeWord };
    case 'TOGGLE_REGEX':
      return { ...state, regexp: !state.regexp };
    case 'SET_MATCHES': {
      const activeMatchIdx = computeActiveIdx(action.matchedCells, state.activeMatchIdx, action.preserveActiveIndex);

      if (activeMatchIdx === state.activeMatchIdx && areMatchesEqual(state.matchedCells, action.matchedCells)) {
        return state;
      }

      return { ...state, matchedCells: action.matchedCells, activeMatchIdx };
    }
    case 'SET_ACTIVE_MATCH': {
      if (state.matchedCells.length === 0) {
        return state;
      }

      const boundedIndex = Math.max(0, Math.min(action.index, state.matchedCells.length - 1));
      if (boundedIndex === state.activeMatchIdx) {
        return state;
      }

      return { ...state, activeMatchIdx: boundedIndex };
    }
    case 'REMOVE_MATCH': {
      const newMatches = [...state.matchedCells];
      newMatches.splice(action.index, 1);
      const newActiveIdx = computeActiveIdxAfterRemoval(newMatches.length, state.activeMatchIdx);
      return { ...state, matchedCells: newMatches, activeMatchIdx: newActiveIdx };
    }
    case 'SET_REPLACE_OPEN': {
      if (state.replaceOpen === action.open) {
        return state;
      }
      return { ...state, replaceOpen: action.open };
    }
  }
}
