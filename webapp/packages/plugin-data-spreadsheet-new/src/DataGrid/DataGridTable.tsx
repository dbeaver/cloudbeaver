/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useMemo, useRef, type HTMLAttributes } from 'react';
import { reaction } from 'mobx';

import { s, TextPlaceholder, useObjectRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
// import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
// import { ClipboardService } from '@cloudbeaver/core-ui';
import { useCaptureViewContext } from '@cloudbeaver/core-view';
import {
  DataGrid,
  useCreateGridReactiveValue,
  type DataGridRef,
  type ICellPosition,
  type IDataGridCellRenderer,
  type DataGridProps,
} from '@cloudbeaver/plugin-data-grid';
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
  DatabaseDataConstraintAction,
  getNextOrder,
  isResultSetDataModel,
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

const rowHeight = 24;
const headerHeight = 32;

export const DataGridTable = observer<IDataPresentationProps>(function DataGridTable({
  model,
  actions,
  resultIndex,
  simple,
  className,
  dataFormat,
  ...rest
}) {
  const translate = useTranslate();
  const styles = useS(classes);

  // const clipboardService = useService(ClipboardService);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const dataGridDivRef = useRef<HTMLDivElement | null>(null);
  const focusedCell = useRef<ICellPosition | null>(null);
  const focusSyncRef = useRef<ICellPosition | null>(null);
  const dataGridRef = useRef<DataGridRef>(null);

  const selectionAction = (model.source as unknown as ResultSetDataSource).getAction(resultIndex, ResultSetSelectAction);
  const viewAction = (model.source as unknown as ResultSetDataSource).getAction(resultIndex, ResultSetViewAction);

  const tableData = useTableData(model as unknown as IDatabaseDataModel<ResultSetDataSource>, resultIndex, dataGridDivRef);
  const gridSelectionContext = useGridSelectionContext(tableData, selectionAction);

  const restoreFocus = useCallback(
    function restoreFocus() {
      const gridDiv = gridContainerRef.current;
      const focusSink = gridDiv?.querySelector<HTMLDivElement>('[aria-selected="true"]');
      focusSink?.focus();
    },
    [gridContainerRef],
  );

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
        selectionAction.focus(key as IResultSetElementKey);
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
        dataGridRef.current?.scrollToCell({ colIdx });
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
  }, [tableData.editor, selectionAction, handlers, tableData]);

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

  const handleScrollToBottom = useCallback(async () => {
    const result = model.source.getResult(resultIndex);
    if (result?.loadedFully) {
      return;
    }

    await model.requestDataPortion(0, model.countGain + model.source.count);
  }, [model, resultIndex]);

  const gridContext = useMemo<IDataGridContext>(
    () => ({
      model,
      actions,
      resultIndex,
      simple,
      isGridInFocus,
      getDataGridApi: () => dataGridRef.current,
      focus: restoreFocus,
    }),
    [model, actions, resultIndex, simple, dataGridRef, restoreFocus],
  );

  const columnsCount = useCreateGridReactiveValue(
    () => tableData.columns.length,
    onValueChange => reaction(() => tableData.columns.length, onValueChange),
    [tableData],
  );
  const rowsCount = useCreateGridReactiveValue(
    () => tableData.rows.length,
    onValueChange => reaction(() => tableData.rows.length, onValueChange),
    [tableData],
  );

  function getCell(rowIdx: number, colIdx: number) {
    return <CellFormatter rowIdx={rowIdx} colIdx={colIdx} />;
  }
  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), []);

  function getCellText(rowIdx: number, colIdx: number) {
    const row = tableData.rows[rowIdx];
    const column = tableData.getColumn(colIdx)?.key;

    if (!row || !column) {
      return '';
    }

    return tableData.format.getText({ row, column });
  }

  const cellText = useCreateGridReactiveValue(
    getCellText,
    (onValueChange, rowIdx, colIdx) => reaction(() => getCellText(rowIdx, colIdx), onValueChange),
    [tableData],
  );

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
    const column = tableData.getColumn(colIdx);

    if (!column) {
      return null;
    }

    if (tableData.isIndexColumn(column)) {
      return <TableIndexColumnHeader />;
    }

    return <TableColumnHeader colIdx={colIdx} />;
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [tableData],
  );

  function getCellElement(rowIdx: number, colIdx: number, props: HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    return <CellRenderer rowIdx={rowIdx} colIdx={colIdx} props={props} renderDefaultCell={renderDefaultCell} />;
  }

  const cellElement = useCreateGridReactiveValue(
    getCellElement,
    (onValueChange, rowIdx, colIdx, props, renderDefaultCell) =>
      reaction(() => getCellElement(rowIdx, colIdx, props, renderDefaultCell), onValueChange),
    [],
  );

  function getColumnSortable(colIdx: number) {
    if (!isResultSetDataModel(model)) {
      return false;
    }
    const constraintsAction = (model.source as unknown as ResultSetDataSource).tryGetAction(resultIndex, DatabaseDataConstraintAction);
    return (
      Boolean(tableData.getColumn(colIdx) && constraintsAction?.supported && isResultSetDataModel(model) && !model.isDisabled(resultIndex)) &&
      colIdx !== 0
    );
  }

  const columnSortable = useCreateGridReactiveValue(
    getColumnSortable,
    (onValueChange, colIdx) => reaction(() => getColumnSortable(colIdx), onValueChange),
    [tableData, model],
  );

  function getColumnSortingState(colIdx: number) {
    if (!isResultSetDataModel(model)) {
      return null;
    }
    const constraintsAction = (model.source as unknown as ResultSetDataSource).tryGetAction(resultIndex, DatabaseDataConstraintAction);
    const column = tableData.getColumn(colIdx)?.key;
    if (!column || !constraintsAction?.supported) {
      return null;
    }
    const resultColumn = tableData.getColumnInfo(column);
    return resultColumn ? constraintsAction?.getOrder(resultColumn.position) : null;
  }

  const columnSortingState = useCreateGridReactiveValue(
    getColumnSortingState,
    (onValueChange, colIdx) => reaction(() => getColumnSortingState(colIdx), onValueChange),
    [tableData, model],
  );

  function handleSort(colIdx: number, order: 'asc' | 'desc' | null, isMultiple: boolean) {
    const column = tableData.getColumn(colIdx)?.key;
    if (!column) {
      return;
    }
    const resultColumn = tableData.getColumnInfo(column);
    if (!resultColumn) {
      return;
    }
    const constraintsAction = (model.source as unknown as ResultSetDataSource).tryGetAction(resultIndex, DatabaseDataConstraintAction);
    const currentOrder = constraintsAction!.getOrder(resultColumn.position);
    const nextOrder = getNextOrder(currentOrder);
    model.request(() => {
      constraintsAction!.setOrder(resultColumn.position, nextOrder, isMultiple);
    });
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

  function getColumnKey(colIdx: number) {
    const column = tableData.columns[colIdx];

    if (column?.key) {
      return ResultSetDataKeysUtils.serialize(column.key);
    }

    return `_${String(colIdx)}`;
  }

  if (!tableData.columns.length) {
    return <TextPlaceholder>{translate('data_grid_table_empty_placeholder')}</TextPlaceholder>;
  }

  const handleCellKeyDown: DataGridProps['onCellKeyDown'] = ({ rowIdx, colIdx }, event) => {
    gridSelectedCellCopy.onKeydownHandler(event);
    const cell = selectionAction.getFocusedElement();

    if (EventContext.has(event, EventStopPropagationFlag) || model.isReadonly(resultIndex) || !cell) {
      return;
    }

    // we can't edit table cells if table doesn't have row identifier, but we can edit just added/duplicated rows before insert (CB-6063)
    const canEdit = model.hasElementIdentifier(resultIndex) || tableData.editor.getElementState(cell) === DatabaseEditChangeType.add;
    const activeElements = selectionAction.getActiveElements();
    const activeRows = selectionAction.getActiveRows();

    switch (event.code) {
      case 'Escape': {
        if (!canEdit) {
          return;
        }
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
        return;
      }
      case 'Delete': {
        if (!canEdit) {
          return;
        }
        event.preventGridDefault();

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
      }
    }
  };

  return (
    <DataGridContext.Provider value={gridContext}>
      <DataGridSelectionContext.Provider value={gridSelectionContext}>
        <TableDataContext.Provider value={tableData}>
          <div
            ref={setContainersRef}
            tabIndex={-1}
            {...rest}
            className={s(styles, { container: true }, className)}
            onMouseDown={onMouseDownHandler}
            onMouseMove={onMouseMoveHandler}
          >
            <DataGrid
              ref={dataGridRef}
              className={s(styles, { grid: true }, className)}
              cell={cell}
              cellText={cellText}
              cellElement={cellElement}
              getCellEditable={isCellEditable}
              headerElement={headerElement}
              getHeaderHeight={() => headerHeight}
              getHeaderWidth={getHeaderWidth}
              getHeaderPinned={getHeaderPinned}
              getHeaderResizable={getHeaderResizable}
              getRowHeight={() => rowHeight}
              getColumnKey={getColumnKey}
              columnCount={columnsCount}
              rowCount={rowsCount}
              columnSortable={columnSortable}
              columnSortingState={columnSortingState}
              getRowId={rowIdx => (tableData.rows[rowIdx] ? ResultSetDataKeysUtils.serialize(tableData.rows[rowIdx]) : '')}
              onFocus={handleFocusChange}
              onScrollToBottom={handleScrollToBottom}
              onColumnSort={handleSort}
              onCellChange={handleCellChange}
              onCellKeyDown={handleCellKeyDown}
              onHeaderKeyDown={gridSelectedCellCopy.onKeydownHandler}
            />
          </div>
        </TableDataContext.Provider>
      </DataGridSelectionContext.Provider>
    </DataGridContext.Provider>
  );
});
