/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Activity, forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  DataGrid as DataGridBase,
  type ColumnOrColumnGroup,
  type CellSelectArgs,
  type DataGridHandle,
  type ColumnWidth,
  type ColumnWidths,
  type CalculatedColumn,
} from 'react-data-grid';
import { rowRenderer } from './renderers/rowRenderer.js';
import { cellRenderer } from './renderers/cellRenderer.js';
import { DataGridCellHeaderContext, type IDataGridHeaderCellContext } from './DataGridHeaderCellContext.js';
import { DataGridCellContext, type IDataGridCellContext } from './DataGridCellContext.js';
import type { IInnerRow } from './IInnerRow.js';
import type { IGridReactiveValue } from './IGridReactiveValue.js';
import { useGridReactiveValue } from './useGridReactiveValue.js';
import { mapCellContentRenderer } from './mapCellContentRenderer.js';
import { mapRenderHeaderCell } from './mapRenderHeaderCell.js';
import { mapEditCellRenderer } from './mapEditCellRenderer.js';
import { DataGridRowContext, type IDataGridRowContext } from './DataGridRowContext.js';
import './DataGrid.css';
import { HeaderDnDContext, isColumn, useHeaderDnD } from './useHeaderDnD.js';
import type { IGridSearchStorage } from './search/useGridSearch.js';
import { GridSearchPanel } from './search/GridSearchPanel.js';
import { useDataGridSearch } from './useDataGridSearch.js';

export interface ICellPosition {
  rowIdx: number;
  colIdx: number;
}

export interface DataGridCellKeyboardEvent extends React.KeyboardEvent<HTMLDivElement> {
  preventGridDefault: () => void;
  isGridDefaultPrevented: () => boolean;
}

export interface DataGridProps extends IDataGridCellContext, IDataGridRowContext, IDataGridHeaderCellContext, React.PropsWithChildren {
  getRowHeight?: (rowIdx: number) => number;
  getRowId?: (rowIdx: number) => React.Key;
  getRowClass?: (rowIdx: number) => string | null;
  columnCount: IGridReactiveValue<number, []>;
  getColumnKey?: (colIdx: number) => string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onFocus?: (position: ICellPosition) => void;
  onEditorOpen?: (position: ICellPosition) => void;
  onCellKeyDown?: (position: ICellPosition, event: DataGridCellKeyboardEvent) => void;
  className?: string;
  search?: {
    isEnabled?: boolean;
    isReadOnly?: boolean;
    storage?: IGridSearchStorage;
  };
}

export interface DataGridRef {
  selectCell: (position: ICellPosition, options?: { deferred?: boolean }) => boolean;
  scrollToCell: (position: Partial<ICellPosition>) => void;
  openEditor: (position: ICellPosition) => void;
  restoreFocus: () => void;
  getColumnsOrdered: () => readonly CalculatedColumn<IInnerRow, unknown>[];
  openSearch: () => void;
  closeSearch: () => void;
  refreshSearch: () => void;
}

const MAX_AUTO_SIZE_WIDTH = 350;

export const DataGrid = forwardRef<DataGridRef, DataGridProps>(function DataGrid(
  {
    headerElement,
    getHeaderWidth,
    headerText,
    getHeaderOrder,
    getHeaderResizable,
    columnSortable,
    getHeaderHeight,
    getHeaderPinned,
    columnSortingState,
    getHeaderDnD,
    cell,
    cellText,
    cellElement,
    cellTooltip,
    getCellEditable,
    columnCount,
    getColumnKey,
    rowElement,
    rowCount,
    columnSortingMultiple,
    getRowId,
    getRowHeight,
    getRowClass,
    onHeaderReorder,
    onScroll,
    onScrollToBottom,
    onFocus,
    onCellChange,
    onCellChangeBatch,
    onColumnSort,
    onHeaderKeyDown,
    children,
    className,
    onCellKeyDown,
    search: { isEnabled: searchEnabled, isReadOnly: searchReadOnly, storage: searchStorage } = {},
  },
  ref,
) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => new Map<string, ColumnWidth>());
  const rowsCount = useGridReactiveValue(rowCount);
  const columnsCount = useGridReactiveValue(columnCount);

  const [prevRowsCount, setPrevRowsCount] = useState(rowsCount);
  const innerGridRef = useRef<DataGridHandle<IInnerRow, unknown>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deferredSelectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    searchOpen,
    searchCellClassName,
    searchPanelRef,
    setSearchPanelRef,
    isReplacingRef,
    handleSearchOpen,
    handleSearchClose,
    onReplace,
    handleReplacingChange,
  } = useDataGridSearch({ containerRef, searchStorage, getCellEditable, onCellChangeBatch });

  function scrollToCell(rowIdx: number, colIdx: number) {
    innerGridRef.current?.scrollToCell({ idx: colIdx, rowIdx });
  }

  const columns = new Array<ColumnOrColumnGroup<IInnerRow, unknown>>(columnsCount)
    .fill(null as any)
    .map((_, i): ColumnOrColumnGroup<IInnerRow, unknown> => {
      const width = getHeaderWidth?.(i) ?? 'max-content';
      return {
        key: getColumnKey?.(i) ?? String(i),
        name: '',
        resizable: getHeaderResizable?.(i) ?? true,
        width,
        minWidth: 26,
        editable: row => getCellEditable?.(row.idx, i) ?? false,
        frozen: getHeaderPinned?.(i),
        renderHeaderCell: mapRenderHeaderCell(i),
        renderCell: mapCellContentRenderer(i),
        renderEditCell: mapEditCellRenderer(i),
      };
    });

  const dndHeaderContext = useHeaderDnD({ columns, onReorder: onHeaderReorder, getCanDrag: getHeaderDnD, getHeaderOrder });

  function mapPositionToColumnKey(position: ICellPosition): string | null {
    const colIdx = dndHeaderContext.getDataColIdx(position.colIdx);
    const columnOrGroup = columns[colIdx];

    if (!columnOrGroup) {
      return null;
    }

    if (isColumn(columnOrGroup)) {
      return columnOrGroup.key;
    }

    return null;
  }

  function restoreFocusInternal() {
    const focusSink = containerRef.current?.querySelector<HTMLDivElement>('[aria-selected="true"]');
    focusSink?.focus();
  }

  useImperativeHandle(ref, () => ({
    selectCell: (position: ICellPosition, options?: { deferred?: boolean }) => {
      if (isReplacingRef.current) {
        return false;
      }

      const columnKey = mapPositionToColumnKey(position);

      if (!columnKey) {
        return false;
      }

      if (options?.deferred) {
        if (deferredSelectRef.current !== null) {
          clearTimeout(deferredSelectRef.current);
        }
        deferredSelectRef.current = setTimeout(() => {
          deferredSelectRef.current = null;
          innerGridRef.current?.selectCellByKey({ columnKey, rowIdx: position.rowIdx });
          requestAnimationFrame(restoreFocusInternal);
        }, 1);
      } else {
        innerGridRef.current?.selectCellByKey({ columnKey, rowIdx: position.rowIdx });
      }

      return true;
    },
    scrollToCell: (position: Partial<ICellPosition>) => {
      innerGridRef.current?.scrollToCell({ idx: position.colIdx && dndHeaderContext.getDataColIdx(position.colIdx), rowIdx: position.rowIdx });
    },
    openEditor: (position: ICellPosition) => {
      const columnKey = mapPositionToColumnKey(position);

      if (!columnKey) {
        return;
      }

      innerGridRef.current?.selectCellByKey(
        { columnKey, rowIdx: position.rowIdx },
        {
          enableEditor: true,
        },
      );
    },
    restoreFocus: restoreFocusInternal,
    getColumnsOrdered: () => innerGridRef.current?.getColumnsOrdered() ?? [],
    openSearch: handleSearchOpen,
    closeSearch: handleSearchClose,
    refreshSearch: () => searchPanelRef.current?.refresh(),
  }));

  if (prevRowsCount !== rowsCount) {
    setPrevRowsCount(rowsCount);

    if (prevRowsCount === 0) {
      setColumnWidths(new Map<string, ColumnWidth>());
    }
  }

  const rows = useMemo(
    () =>
      new Array<IInnerRow>(rowsCount).fill({ idx: 0 }).map((_, i) => ({
        idx: i,
      })),
    [rowsCount],
  );

  function handleCellFocus(args: CellSelectArgs<IInnerRow, unknown>) {
    if (isReplacingRef.current) {
      return;
    }
    onFocus?.({ colIdx: dndHeaderContext.getDataColIdxByKey(args.column.key), rowIdx: args.rowIdx });
  }

  function handleCellKeyDown(args: CellSelectArgs<IInnerRow, unknown>, event: DataGridCellKeyboardEvent) {
    onCellKeyDown?.({ colIdx: dndHeaderContext.getDataColIdxByKey(args.column.key), rowIdx: args.rowIdx }, event);
  }

  // We need to patch auto-size width to avoid extremely large columns on table initialization
  for (const [key, column] of columnWidths) {
    const isMeasured = column.type === 'measured';
    const isAutoSized = getHeaderWidth?.(Number(key)) === 'auto';
    const isOversized = column.width > MAX_AUTO_SIZE_WIDTH;

    if (isAutoSized || !isMeasured || !isOversized) {
      continue;
    }

    (columnWidths as Map<string, ColumnWidth>).set(key, {
      ...column,
      type: 'resized',
      width: MAX_AUTO_SIZE_WIDTH,
    });
  }

  return (
    <div ref={containerRef} className="rdg-search-container">
      <HeaderDnDContext value={dndHeaderContext}>
        <DataGridRowContext value={{ rowElement, rowCount, onScrollToBottom }}>
          <DataGridCellContext value={{ cell, cellText, cellElement, cellTooltip, getCellClassName: searchCellClassName, onCellChange }}>
            <DataGridCellHeaderContext
              value={{
                headerElement,
                headerText,
                getHeaderDnD,
                columnSortable,
                onColumnSort,
                columnSortingState,
                onHeaderKeyDown,
                columnSortingMultiple,
              }}
            >
              <DataGridBase
                ref={innerGridRef}
                columns={dndHeaderContext.columns}
                rows={rows}
                className={className}
                headerRowHeight={getHeaderHeight?.()}
                rowHeight={getRowHeight ? row => getRowHeight(row.idx) : undefined}
                rowKeyGetter={getRowId ? row => getRowId(row.idx) : undefined}
                rowClass={getRowClass ? row => getRowClass(row.idx) : undefined}
                columnWidths={columnWidths}
                renderers={{
                  renderRow: rowRenderer,
                  renderCell: cellRenderer,
                  noRowsFallback: children,
                }}
                onScroll={onScroll}
                onSelectedCellChange={handleCellFocus}
                onCellKeyDown={handleCellKeyDown}
                onColumnWidthsChange={setColumnWidths}
              />
              <Activity mode={searchEnabled && searchOpen ? 'visible' : 'hidden'}>
                <GridSearchPanel
                  ref={setSearchPanelRef}
                  columnCount={columnsCount}
                  isReadOnly={searchReadOnly}
                  scrollToCell={scrollToCell}
                  storage={searchStorage}
                  open={searchOpen}
                  onReplace={onReplace}
                  onClose={handleSearchClose}
                  onReplacingChange={handleReplacingChange}
                />
              </Activity>
            </DataGridCellHeaderContext>
          </DataGridCellContext>
        </DataGridRowContext>
      </HeaderDnDContext>
    </div>
  );
});
