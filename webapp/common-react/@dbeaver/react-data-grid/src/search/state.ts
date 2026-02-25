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

export interface GridSearchState extends GridSearchMatchState, GridSearchQueryState, GridSearchUiState {}

export type GridSearchReducerAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_REPLACE'; replace: string }
  | { type: 'TOGGLE_CASE_SENSITIVE' }
  | { type: 'TOGGLE_WHOLE_WORD' }
  | { type: 'TOGGLE_REGEX' }
  | { type: 'SET_MATCHES'; matchedCells: ICellMatch[]; preserveActiveIndex: boolean }
  | { type: 'NAVIGATE_NEXT' }
  | { type: 'NAVIGATE_PREVIOUS' }
  | { type: 'REMOVE_MATCH'; index: number }
  | { type: 'SET_REPLACE_OPEN'; open: boolean };

export function computeActiveIdx(matchedCells: ICellMatch[], currentIdx: number, preserve: boolean): number {
  if (preserve && currentIdx >= 0 && currentIdx < matchedCells.length) {
    return currentIdx;
  }
  return matchedCells.length > 0 ? 0 : -1;
}

export function computeActiveIdxAfterRemoval(matchCount: number, activeIdx: number): number {
  if (matchCount === 0) {
    return -1;
  }
  if (activeIdx >= matchCount) {
    return matchCount - 1;
  }
  return activeIdx;
}

function areMatchesEqual(left: ICellMatch[], right: ICellMatch[]): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    const leftMatch = left[i];
    const rightMatch = right[i];

    if (!leftMatch || !rightMatch || leftMatch.rowIdx !== rightMatch.rowIdx || leftMatch.colIdx !== rightMatch.colIdx) {
      return false;
    }
  }

  return true;
}

export function gridSearchReducer(state: GridSearchState, action: GridSearchReducerAction): GridSearchState {
  switch (action.type) {
    case 'SET_QUERY': {
      if (state.query === action.query) {
        return state;
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
    case 'NAVIGATE_NEXT': {
      if (state.matchedCells.length === 0) {
        return state;
      }
      return { ...state, activeMatchIdx: (state.activeMatchIdx + 1) % state.matchedCells.length };
    }
    case 'NAVIGATE_PREVIOUS': {
      if (state.matchedCells.length === 0) {
        return state;
      }
      const prevIdx = state.activeMatchIdx === 0 ? state.matchedCells.length - 1 : state.activeMatchIdx - 1;
      return { ...state, activeMatchIdx: prevIdx };
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
