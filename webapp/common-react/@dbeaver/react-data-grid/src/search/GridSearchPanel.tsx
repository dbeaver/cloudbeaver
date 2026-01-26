/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { SearchPanel, type SearchPanelRef } from '@dbeaver/ui-kit';

import { DataGridCellContext } from '../DataGridCellContext.js';
import { DataGridRowContext } from '../DataGridRowContext.js';
import type { IGridReactiveValue } from '../IGridReactiveValue.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import { type IGridSearchPersistence, useGridSearch } from './useGridSearch.js';

export interface GridSearchPanelRef {
  focus: () => void;
}

interface GridSearchPanelProps {
  columnCount: number;
  scrollToCell: (position: { rowIdx: number; colIdx: number }) => void;
  replaceCellValue: (rowIdx: number, colIdx: number, value: string) => void;
  onCellClassNameChange: (value: IGridReactiveValue<string | undefined, [number, number]> | undefined) => void;
  onClose: () => void;
  defaultState?: IGridSearchPersistence;
  onStateChange?: (state: IGridSearchPersistence) => void;
}

export const GridSearchPanel = forwardRef<GridSearchPanelRef, GridSearchPanelProps>(function GridSearchPanel(
  { columnCount, scrollToCell, replaceCellValue, onCellClassNameChange, onClose, defaultState, onStateChange },
  ref,
) {
  const panelRef = useRef<SearchPanelRef>(null);
  const { cellText } = useContext(DataGridCellContext) ?? {};
  const rowContext = useContext(DataGridRowContext);
  const rowCount = useGridReactiveValue(rowContext?.rowCount);

  const { snapshot, actions, getCellClassName, replaceOpen } = useGridSearch({
    rowCount: rowCount ?? 0,
    columnCount,
    getCellText: (r, c) => cellText?.get(r, c) ?? '',
    scrollToCell,
    replaceCellValue,
    defaultState,
    onChange: onStateChange,
  });

  useEffect(() => {
    onCellClassNameChange(getCellClassName);
    return () => onCellClassNameChange(undefined);
  }, [getCellClassName, onCellClassNameChange]);

  useImperativeHandle(ref, () => ({
    focus: () => panelRef.current?.focus(),
  }));

  function handleClose() {
    actions.close();
    onClose();
  }

  return (
    <SearchPanel
      ref={panelRef}
      className="rdg-search-panel"
      isReadOnly={!replaceCellValue}
      query={{
        search: snapshot.query,
        replace: snapshot.replace,
        caseSensitive: snapshot.caseSensitive,
        wholeWord: snapshot.wholeWord,
        regexp: snapshot.regexp,
      }}
      defaultShowReplace={replaceOpen}
      searchMatchesCount={{
        count: snapshot.matchCount,
        current: snapshot.activeMatchIndex >= 0 ? snapshot.activeMatchIndex + 1 : 0,
      }}
      onQueryChange={actions.setQuery}
      onCaseSensitiveToggle={actions.toggleCaseSensitive}
      onWholeWordToggle={actions.toggleWholeWord}
      onRegexToggle={actions.toggleRegex}
      onFindNext={actions.findNext}
      onFindPrevious={actions.findPrevious}
      onReplaceChange={actions.setReplace}
      onReplaceToggle={actions.setReplaceOpen}
      onReplaceAll={actions.replaceAll}
      onReplaceNext={actions.replaceActive}
      onClose={handleClose}
    />
  );
});
