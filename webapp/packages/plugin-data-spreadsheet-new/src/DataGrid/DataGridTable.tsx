/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type HTMLAttributes } from 'react';

import { s, TextPlaceholder, useObjectRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { ClipboardService } from '@cloudbeaver/core-ui';
import { throttle } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';
import { DataGrid, type DataGridRef, type ICellPosition, type IDataGridCellRenderer } from '@cloudbeaver/plugin-data-grid';
import {
  DATA_CONTEXT_DV_PRESENTATION,
  type DatabaseDataSelectActionsData,
  DatabaseEditChangeType,
  DatabaseSelectAction,
  DataViewerPresentationType,
  type IDatabaseDataModel,
  type IDataPresentationProps,
  type IResultSetEditActionData,
  type IResultSetElementKey,
  type IResultSetPartialKey,
  isBooleanValuePresentationAvailable,
  ResultSetDataKeysUtils,
  ResultSetDataSource,
  ResultSetSelectAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import { CellRenderer } from './CellRenderer/CellRenderer.js';
import { DataGridContext, type IDataGridContext } from './DataGridContext.js';
import { DataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import { useGridSelectionContext } from './DataGridSelection/useGridSelectionContext.js';
import classes from './DataGridTable.module.css';
import { CellFormatter } from './Formatters/CellFormatter.js';
import { TableDataContext } from './TableDataContext.js';
import { useGridDragging } from './useGridDragging.js';
import { useGridSelectedCellsCopy } from './useGridSelectedCellsCopy.js';
import { useTableData } from './useTableData.js';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader.js';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader.js';

interface IInnerState {
  lastCount: number;
  lastScrollTop: number;
}

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const { clientHeight, scrollTop, scrollHeight } = event.target as HTMLDivElement;
  return clientHeight + scrollTop + 100 > scrollHeight;
}

const rowHeight = 24;
const headerHeight = 32;

export const DataGridTable = observer<IDataPresentationProps>(function DataGridTable({ model, actions, resultIndex, simple, className, ...rest }) {
  const translate = useTranslate();
  const styles = useS(classes);

  const clipboardService = useService(ClipboardService);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const dataGridDivRef = useRef<HTMLDivElement | null>(null);
  const focusedCell = useRef<ICellPosition | null>(null);
  const focusSyncRef = useRef<ICellPosition | null>(null);
  const dataGridRef = useRef<DataGridRef>(null);
  const innerState = useObjectRef<IInnerState>(
    () => ({
      lastCount: 0,
      lastScrollTop: 0,
    }),
    false,
  );

  const selectionAction = (model.source as unknown as ResultSetDataSource).getAction(resultIndex, ResultSetSelectAction);
  const viewAction = (model.source as unknown as ResultSetDataSource).getAction(resultIndex, ResultSetViewAction);

  const tableData = useTableData(model as unknown as IDatabaseDataModel<ResultSetDataSource>, resultIndex, dataGridDivRef);
  const gridSelectionContext = useGridSelectionContext(tableData, selectionAction);

  function restoreFocus() {
    const gridDiv = gridContainerRef.current;
    const focusSink = gridDiv?.querySelector<HTMLDivElement>('[aria-selected="true"]');
    focusSink?.focus();
  }

  function isGridInFocus(): boolean {
    const gridDiv = gridContainerRef.current;
    const focusSink = gridDiv?.querySelector('[aria-selected="true"]');

    if (!gridDiv || !focusSink) {
      return false;
    }

    const active = document.activeElement;

    return gridDiv === active || focusSink === active;
  }

  function setContainersRef(element: HTMLDivElement | null) {
    gridContainerRef.current = element;

    if (element) {
      const gridDiv = element.firstChild;

      if (gridDiv instanceof HTMLDivElement) {
        dataGridDivRef.current = gridDiv;
      } else {
        dataGridDivRef.current = null;
      }
    }
  }

  const handlers = useObjectRef(() => ({
    selectCell(pos: ICellPosition, scroll = false): void {
      if (focusedCell.current?.colIdx !== pos.colIdx || focusedCell.current?.rowIdx !== pos.rowIdx || scroll) {
        dataGridRef.current?.selectCell(pos);
      }
    },
    focusCell(key: Partial<IResultSetElementKey> | null, initial = false) {
      if ((!key?.column || !key?.row) && initial) {
        const selectedElements = selectionAction.getSelectedElements();

        if (selectedElements.length > 0) {
          key = selectedElements[0]!;
        } else {
          key = { column: viewAction.columnKeys[0], row: viewAction.rowKeys[0] };
        }
      }

      if (!key?.column || !key?.row) {
        if (initial) {
          focusSyncRef.current = { colIdx: 0, rowIdx: -1 };
          this.selectCell(focusSyncRef.current);
        } else {
          focusSyncRef.current = null;
        }
        return;
      }

      const colIdx = tableData.getColumnIndexFromColumnKey(key.column!);
      const rowIdx = tableData.getRowIndexFromKey(key.row!);

      focusSyncRef.current = { colIdx, rowIdx };

      this.selectCell({ colIdx, rowIdx });
    },
  }));

  const gridSelectedCellCopy = useGridSelectedCellsCopy(tableData, selectionAction as unknown as DatabaseSelectAction, gridSelectionContext);
  const { onMouseDownHandler, onMouseMoveHandler } = useGridDragging({
    onDragStart: startPosition => {
      handlers.selectCell(startPosition);
    },
    onDragOver: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, true);
    },
    onDragEnd: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, false);
    },
  });

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_DV_PRESENTATION, { type: DataViewerPresentationType.Data }, id);
  });

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    gridSelectedCellCopy.onKeydownHandler(event);
    const cell = selectionAction.getFocusedElement();
    // we can't edit table cells if table doesn't have row identifier, but we can edit new created rows before insert (CB-6063)
    const canEdit = model.hasElementIdentifier(resultIndex) || !!(cell && tableData.editor.getElementState(cell) === DatabaseEditChangeType.add);

    if (EventContext.has(event, EventStopPropagationFlag) || !canEdit || model.isReadonly(resultIndex)) {
      return;
    }

    const activeElements = selectionAction.getActiveElements();
    const activeRows = selectionAction.getActiveRows();

    if (!cell) {
      return;
    }

    const colIdx = tableData.getColumnIndexFromColumnKey(cell.column);
    const rowIdx = tableData.getRowIndexFromKey(cell.row);

    switch (event.nativeEvent.code) {
      case 'Escape': {
        tableData.editor.revert(...activeElements);
        return;
      }
      case 'KeyR': {
        if (event.altKey) {
          if (event.shiftKey) {
            tableData.editor.duplicate(...activeRows);
          } else {
            tableData.editor.add(cell);
          }
          return;
        }
      }
    }

    const editingState = tableData.editor.getElementState(cell);

    switch (event.nativeEvent.code) {
      case 'Delete': {
        const filteredRows = activeRows.filter(cell => tableData.editor.getElementState(cell) !== DatabaseEditChangeType.delete);

        if (filteredRows.length > 0) {
          const editor = tableData.editor;
          const firstRow = filteredRows[0]!;
          const editingState = tableData.editor.getElementState(firstRow);

          editor.delete(...filteredRows);

          if (editingState === DatabaseEditChangeType.add) {
            if (rowIdx - 1 > 0) {
              handlers.selectCell({ colIdx, rowIdx: rowIdx - 1 });
            }
          } else {
            if (rowIdx + 1 < tableData.rows.length) {
              handlers.selectCell({ colIdx, rowIdx: rowIdx + 1 });
            }
          }
        }

        return;
      }
      case 'KeyV': {
        if (editingState === DatabaseEditChangeType.delete) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          if (!clipboardService.clipboardAvailable || clipboardService.state === 'denied' || tableData.isCellReadonly(cell)) {
            return;
          }

          clipboardService
            .read()
            .then(value => tableData.editor.set(cell, value))
            .catch();
          return;
        }
      }
    }

    if (editingState === DatabaseEditChangeType.delete) {
      return;
    }
  }

  useLayoutEffect(() => {
    function syncEditor(data: IResultSetEditActionData) {
      const editor = tableData.editor;
      if (data.resultId !== editor.result.id || !data.value || data.value.length === 0 || data.type === DatabaseEditChangeType.delete) {
        return;
      }

      const key = data.value[data.value.length - 1]!.key;

      const colIdx = tableData.getColumnIndexFromColumnKey(key.column);
      const rowIdx = tableData.getRowIndexFromKey(key.row);

      if (selectionAction.isFocused(key)) {
        const rowTop = rowIdx * rowHeight;
        const gridDiv = dataGridDivRef.current;
        dataGridRef.current?.scrollToCell({ colIdx });

        if (gridDiv) {
          if (rowTop < gridDiv.scrollTop - rowHeight + headerHeight) {
            gridDiv.scrollTo({
              top: rowTop,
            });
          } else if (rowTop > gridDiv.scrollTop + gridDiv.clientHeight - headerHeight - rowHeight) {
            gridDiv.scrollTo({
              top: rowTop - gridDiv.clientHeight + headerHeight + rowHeight,
            });
          }
        }
        return;
      }

      handlers.selectCell({ colIdx, rowIdx });
    }

    tableData.editor.action.addHandler(syncEditor);

    function syncFocus(data: DatabaseDataSelectActionsData<IResultSetPartialKey>) {
      if (data.type === 'focus') {
        // TODO: we need this delay to update focus after render rows update
        setTimeout(() => {
          handlers.focusCell(data.key);
        }, 1);
      }
    }

    selectionAction.actions.addHandler(syncFocus);
    handlers.focusCell(selectionAction.getFocusedElement(), true);

    return () => {
      tableData.editor.action.removeHandler(syncEditor);
    };
  }, [tableData.editor, selectionAction]);

  useEffect(() => {
    const gridDiv = dataGridDivRef.current;

    if (
      gridDiv &&
      innerState.lastCount > model.source.count &&
      model.source.count * rowHeight < gridDiv.scrollTop + gridDiv.clientHeight - headerHeight
    ) {
      gridDiv.scrollTo({
        top: model.source.count * rowHeight - gridDiv.clientHeight + headerHeight - 1,
      });
    }

    innerState.lastCount = model.source.count;
  }, [model.source.count]);

  const handleFocusChange = (position: ICellPosition) => {
    focusedCell.current = position;
    const columnIndex = position.colIdx;
    const rowIndex = position.rowIdx;

    if (focusSyncRef.current && focusSyncRef.current.colIdx === columnIndex && focusSyncRef.current.rowIdx === rowIndex) {
      focusSyncRef.current = null;
      return;
    }

    const column = tableData.getColumn(columnIndex);
    const row = tableData.getRow(rowIndex);

    if (column?.key && row) {
      selectionAction.focus({
        row,
        column: { ...column.key },
      });
    } else {
      selectionAction.focus(null);
    }
  };

  const handleScroll = useCallback(
    throttle(async (event: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = (event.target as HTMLDivElement).scrollTop;
      const toBottom = scrollTop > innerState.lastScrollTop;

      innerState.lastScrollTop = scrollTop;

      if (toBottom && isAtBottom(event)) {
        const result = model.source.getResult(resultIndex);
        if (result?.loadedFully) {
          return;
        }

        await model.requestDataPortion(0, model.countGain + model.source.count);
      }
    }, 200),
    [model, resultIndex],
  );

  const gridContext = useMemo<IDataGridContext>(
    () => ({
      model,
      actions,
      resultIndex,
      simple,
      isGridInFocus,
      getEditorPortal: () => editorRef.current,
      getDataGridApi: () => dataGridRef.current,
      focus: restoreFocus,
    }),
    [model, actions, resultIndex, simple, editorRef, dataGridRef, gridContainerRef, restoreFocus],
  );

  if (!tableData.columns.length) {
    return <TextPlaceholder>{translate('data_grid_table_empty_placeholder')}</TextPlaceholder>;
  }

  function getCell(rowIdx: number, colIdx: number) {
    return <CellFormatter rowIdx={rowIdx} colIdx={colIdx} />;
  }

  function getCellText(rowIdx: number, colIdx: number) {
    const row = tableData.rows[rowIdx];
    const column = tableData.getColumn(colIdx)?.key;

    if (!row || !column) {
      return '';
    }

    return tableData.format.getText({ row, column });
  }

  function getHeaderWidth(colIdx: number) {
    if (colIdx === 0) {
      return 60;
    }
    return null;
  }

  function getHeaderPinned(colIdx: number) {
    if (colIdx === 0) {
      return true;
    }
    return false;
  }

  function getHeaderResizable(colIdx: number) {
    return colIdx !== 0;
  }

  function getHeaderElement(colIdx: number) {
    const column = tableData.getColumn(colIdx)!;

    if (tableData.isIndexColumn(column)) {
      return <TableIndexColumnHeader />;
    }

    return <TableColumnHeader colIdx={colIdx} />;
  }

  function getCellElement(rowIdx: number, colIdx: number, props: HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    return <CellRenderer rowIdx={rowIdx} colIdx={colIdx} props={props} renderDefaultCell={renderDefaultCell} />;
  }

  function handleCellChange(rowIdx: number, colIdx: number, value: string) {
    const row = tableData.rows[rowIdx];
    const column = tableData.getColumn(colIdx)?.key;

    if (!row || !column) {
      return;
    }

    tableData.editor.set({ row, column }, value);
  }

  function isCellEditable(rowIdx: number, colIdx: number): boolean {
    const row = tableData.rows[rowIdx];
    const column = tableData.getColumn(colIdx)?.key;

    if (!row || !column) {
      return false;
    }

    const cell = { row, column };

    const editionState = tableData.getEditionState(cell);

    if (!gridContext.model.hasElementIdentifier(tableData.view.resultIndex) && editionState !== DatabaseEditChangeType.add) {
      return false;
    }

    if (tableData.format.isBinary(cell) || tableData.format.isGeometry(cell) || tableData.dataContent.isTextTruncated(cell)) {
      return false;
    }

    const resultColumn = tableData.getColumnInfo(cell.column);
    const value = tableData.getCellValue(cell);

    if (!resultColumn || value === undefined) {
      return false;
    }

    const handleByBooleanFormatter = isBooleanValuePresentationAvailable(value, resultColumn);

    return !(handleByBooleanFormatter || tableData.isCellReadonly(cell));
  }

  return (
    <DataGridContext.Provider value={gridContext}>
      <DataGridSelectionContext.Provider value={gridSelectionContext}>
        <TableDataContext.Provider value={tableData}>
          <div
            ref={setContainersRef}
            tabIndex={-1}
            {...rest}
            className={s(styles, { container: true }, className)}
            onKeyDown={handleKeyDown}
            onMouseDown={onMouseDownHandler}
            onMouseMove={onMouseMoveHandler}
          >
            <DataGrid
              ref={dataGridRef}
              className={s(styles, { grid: true }, className)}
              getCell={getCell}
              getCellText={getCellText}
              getCellElement={getCellElement}
              getCellEditable={isCellEditable}
              getHeaderElement={getHeaderElement}
              getHeaderHeight={() => headerHeight}
              getHeaderWidth={getHeaderWidth}
              getHeaderPinned={getHeaderPinned}
              getHeaderResizable={getHeaderResizable}
              getRowHeight={() => rowHeight}
              getColumnCount={() => tableData.columns.length}
              getRowCount={() => tableData.rows.length}
              getRowId={rowIdx => (tableData.rows[rowIdx] ? ResultSetDataKeysUtils.serialize(tableData.rows[rowIdx]) : '')}
              onFocus={handleFocusChange}
              onScroll={handleScroll}
              onCellChange={handleCellChange}
            />
            <div ref={editorRef} />
          </div>
        </TableDataContext.Provider>
      </DataGridSelectionContext.Provider>
    </DataGridContext.Provider>
  );
});
