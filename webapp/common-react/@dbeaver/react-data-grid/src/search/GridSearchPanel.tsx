/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { clsx, SearchPanel, type SearchPanelRef } from '@dbeaver/ui-kit';

import { DataGridCellContext, type ICellChange } from '../DataGridCellContext.js';
import { DataGridRowContext } from '../DataGridRowContext.js';
import type { IGridReactiveValue } from '../IGridReactiveValue.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import { type IGridSearchStorage, useGridSearch } from './useGridSearch.js';

export interface GridSearchPanelRef {
  focus: () => void;
  refresh: () => void;
  getCellClassName: IGridReactiveValue<string | undefined, [number, number]>;
}

interface GridSearchPanelProps {
  columnCount: number;
  scrollToCell: (rowIdx: number, colIdx: number) => void;
  onReplace: (updates: ICellChange[]) => void;
  onClose: () => void;
  onReplacingChange?: (isReplacing: boolean) => void;
  isReadOnly?: boolean;
  storage?: IGridSearchStorage;
  open?: boolean;
}

export const GridSearchPanel = forwardRef<GridSearchPanelRef, GridSearchPanelProps>(function GridSearchPanel(
  { columnCount, scrollToCell, onReplace, onClose, onReplacingChange, isReadOnly, storage, open },
  ref,
) {
  const panelRef = useRef<SearchPanelRef>(null);
  const { cellText } = useContext(DataGridCellContext) ?? {};
  const rowContext = useContext(DataGridRowContext);
  const rowCount = useGridReactiveValue(rowContext?.rowCount);

  const { snapshot, actions, getCellClassName, replaceOpen } = useGridSearch({
    rowCount: rowCount ?? 0,
    columnCount,
    cellText,
    scrollToCell,
    onReplace,
    onReplacingChange,
    storage,
    open,
  });

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => panelRef.current?.focus(),
      refresh: () => actions.refresh(),
      getCellClassName,
    }),
    [actions, getCellClassName],
  );

  function handleClose() {
    actions.close();
    onClose();
  }

  return (
    <SearchPanel
      ref={panelRef}
      className={clsx('rdg-search-panel tw:bg-(--theme-secondary)', isReadOnly && 'tw:px-0!')}
      isReadOnly={isReadOnly}
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
