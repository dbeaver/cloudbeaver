/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'reshadow';

import { TextPlaceholder, useObjectRef, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { Executor } from '@cloudbeaver/core-executor';
import { ClipboardService } from '@cloudbeaver/core-ui';
import {
  DatabaseDataSelectActionsData, DatabaseEditChangeType, IDatabaseResultSet, IDataPresentationProps,
  IResultSetEditActionData, IResultSetElementKey, IResultSetPartialKey, ResultSetDataKeysUtils, ResultSetSelectAction
} from '@cloudbeaver/plugin-data-viewer';
import type { DataGridHandle, Position } from '@cloudbeaver/plugin-react-data-grid';
import DataGrid from '@cloudbeaver/plugin-react-data-grid';

import { CellPosition, EditingContext } from '../Editing/EditingContext';
import { useEditing } from '../Editing/useEditing';
import baseStyles from '../styles/base.scss';
import { reactGridStyles } from '../styles/styles';
import { CellRenderer } from './CellRenderer/CellRenderer';
import { DataGridContext, IColumnResizeInfo, IDataGridContext } from './DataGridContext';
import { DataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import { useGridSelectionContext } from './DataGridSelection/useGridSelectionContext';
import { CellFormatter } from './Formatters/CellFormatter';
import { TableDataContext } from './TableDataContext';
import { useGridDragging } from './useGridDragging';
import { useGridSelectedCellsCopy } from './useGridSelectedCellsCopy';
import { useTableData } from './useTableData';

interface IInnerState {
  lastCount: number;
  lastScrollTop: number;
}

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const target = event.target as HTMLDivElement;
  return target.clientHeight + target.scrollTop + 100 > target.scrollHeight;
}

const rowHeight = 25;
const headerHeight = 28;

export const DataGridTable = observer<IDataPresentationProps<any, IDatabaseResultSet>>(function DataGridTable({ model, actions, resultIndex, simple, className }) {
  const translate = useTranslate();

  const clipboardService = useService(ClipboardService);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const dataGridDivRef = useRef<HTMLDivElement | null>(null);
  const dataGridRef = useRef<DataGridHandle>(null);
  const innerState = useObjectRef<IInnerState>(() => ({
    lastCount: 0,
    lastScrollTop: 0,
  }), false);
  const styles = useStyles(reactGridStyles, baseStyles);
  const [columnResize] = useState(() => new Executor<IColumnResizeInfo>());

  const selectionAction = model.source.getAction(resultIndex, ResultSetSelectAction);

  const focusSyncRef = useRef<CellPosition | null>(null);

  const editingContext = useEditing({
    readonly: model.isReadonly(resultIndex) || model.isDisabled(resultIndex),
    onEdit: (position, code, key) => {
      const column = tableData.getColumn(position.idx);
      const row = tableData.getRow(position.rowIdx);

      if (!column?.columnDataIndex || !row) {
        return false;
      }

      const cellKey: IResultSetElementKey = { row, column: column.columnDataIndex };

      if (tableData.isCellReadonly(cellKey)) {
        return false;
      }

      switch (code) {
        case 'Backspace':
          tableData.editor.set(cellKey, '');
          break;
        case 'Enter':
          break;
        default:
          if (key) {
            if (/^[\d\p{L}]$/iu.test(key) && key.length === 1) {
              tableData.editor.set(cellKey, key);
            } else {
              return false;
            }
          }
      }

      return true;
    },
    onCloseEditor: () => {
      restoreFocus();
    },
  });

  const tableData = useTableData(model, resultIndex, dataGridDivRef);
  const gridSelectionContext = useGridSelectionContext(tableData, selectionAction);

  function restoreFocus() {
    const gridDiv = gridContainerRef.current;
    const focusSink = gridDiv?.querySelector<HTMLDivElement>('[tabindex="0"]');
    focusSink?.focus();
  }

  function isGridInFocus(): boolean {
    const gridDiv = gridContainerRef.current;
    const focusSink = gridDiv?.querySelector('[tabindex="0"]');

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

  const hamdlers = useObjectRef(() => ({
    selectCell(pos: Position, scroll = false): void {
      if (
        dataGridRef.current?.selectedCell.idx !== pos.idx
        || dataGridRef.current.selectedCell.rowIdx !== pos.rowIdx
        || scroll
      ) {
        dataGridRef.current?.selectCell(pos);
      }
    },
  }));

  const gridSelectedCellCopy = useGridSelectedCellsCopy(tableData, selectionAction, gridSelectionContext);
  const { onMouseDownHandler, onMouseMoveHandler } = useGridDragging({
    onDragStart: startPosition => {
      hamdlers.selectCell({ idx: startPosition.colIdx, rowIdx: startPosition.rowIdx });
    },
    onDragOver: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, true);
    },
    onDragEnd: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, false);
    },
  });

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    gridSelectedCellCopy.onKeydownHandler(event);

    if (EventContext.has(event, EventStopPropagationFlag) || tableData.isReadOnly() || model.isReadonly(resultIndex)) {
      return;
    }

    const cell = selectionAction.getFocusedElement();
    const activeElements = selectionAction.getActiveElements();
    const activeRows = selectionAction.getActiveRows();

    if (!cell) {
      return;
    }

    const idx = tableData.getColumnIndexFromColumnKey(cell.column);
    const rowIdx = tableData.getRowIndexFromKey(cell.row);
    const position: CellPosition = { idx, rowIdx };

    if (editingContext.isEditing(position)) {
      return;
    }

    switch (event.nativeEvent.code) {
      case 'Escape': {
        tableData.editor.revert(...activeElements);
        return;
      }
      case 'Insert': {
        if (event.altKey) {
          if (event.ctrlKey || event.metaKey) {
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
        const filteredRows = activeRows
          .filter(cell => tableData.editor.getElementState(cell) !== DatabaseEditChangeType.delete);

        if (filteredRows.length > 0) {
          const editor = tableData.editor;
          const firstRow = filteredRows[0];
          const editingState = tableData.editor.getElementState(firstRow);

          editor.delete(...filteredRows);

          if (editingState === DatabaseEditChangeType.add) {
            if (rowIdx - 1 > 0) {
              hamdlers.selectCell({ idx, rowIdx: rowIdx - 1 });
            }
          } else {
            if (rowIdx + 1 < tableData.rows.length) {
              hamdlers.selectCell({ idx, rowIdx: rowIdx + 1 });
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

    editingContext.edit({ idx, rowIdx }, event.nativeEvent.code, event.key);
  }

  useEffect(() => {
    function syncEditor(data: IResultSetEditActionData) {
      const editor = tableData.editor;
      if (
        data.resultId !== editor.result.id
        || !data.value
        || data.value.length === 0
        || data.type === DatabaseEditChangeType.delete
      ) {
        return;
      }

      const key = data.value[data.value.length - 1].key;

      const idx = tableData.getColumnIndexFromColumnKey(key.column);
      const rowIdx = tableData.getRowIndexFromKey(key.row);

      if (data.revert) {
        editingContext.closeEditor({
          rowIdx,
          idx,
        });
      }

      if (selectionAction.isFocused(key)) {
        const rowTop = rowIdx * rowHeight;
        const gridDiv = dataGridDivRef.current;
        dataGridRef.current?.scrollToColumn(idx);

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

      hamdlers.selectCell({ idx, rowIdx });
    }

    tableData.editor.action.addHandler(syncEditor);

    function syncFocus(data: DatabaseDataSelectActionsData<IResultSetPartialKey>) {
      setTimeout(() => { // TODO: update focus after render rows update
        if (data.type === 'focus') {
          if (!data.key?.column || !data.key.row) {
            return;
          }

          const idx = tableData.getColumnIndexFromColumnKey(data.key.column);
          const rowIdx = tableData.getRowIndexFromKey(data.key.row);

          focusSyncRef.current = { idx, rowIdx };

          hamdlers.selectCell({ idx, rowIdx });
        }
      }, 1);
    }

    selectionAction.actions.addHandler(syncFocus);

    return () => {
      tableData.editor.action.removeHandler(syncEditor);
    };
  }, [tableData.editor, editingContext, selectionAction]);

  useEffect(() => {
    const gridDiv = dataGridDivRef.current;

    if (
      gridDiv
      && innerState.lastCount > model.source.count
      && model.source.count * rowHeight < gridDiv.scrollTop + gridDiv.clientHeight - headerHeight
    ) {
      gridDiv.scrollTo({
        top: model.source.count * rowHeight - gridDiv.clientHeight + headerHeight - 1,
      });
    }

    innerState.lastCount = model.source.count;
  }, [model.source.count]);

  const handleFocusChange = (position: CellPosition) => {
    if (
      focusSyncRef.current
      && focusSyncRef.current.idx === position.idx
      && focusSyncRef.current.rowIdx === position.rowIdx
    ) {
      focusSyncRef.current = null;
      return;
    }

    const column = tableData.getColumn(position.idx);
    const row = tableData.getRow(position.rowIdx);

    if (column && row) {
      selectionAction.focus({
        row,
        column: { index: 0, ...column.columnDataIndex },
      });
    }
  };

  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      const toBottom = target.scrollTop > innerState.lastScrollTop;

      innerState.lastScrollTop = target.scrollTop;

      if (!toBottom || !isAtBottom(event)) {
        return;
      }

      const result = model.getResult(resultIndex);
      if (result?.loadedFully) {
        return;
      }

      await model.requestDataPortion(0, model.countGain + model.source.count);
    },
    [model, resultIndex]
  );

  const gridContext = useMemo<IDataGridContext>(() => ({
    model,
    actions,
    columnResize,
    resultIndex,
    simple,
    isGridInFocus,
    getEditorPortal: () => editorRef.current,
    getDataGridApi: () => dataGridRef.current,
    focus: restoreFocus,
  }), [model, actions, resultIndex, simple, editorRef, dataGridRef, gridContainerRef, restoreFocus]);

  if (!tableData.columns.length) {
    return <TextPlaceholder>{translate('data_grid_table_empty_placeholder')}</TextPlaceholder>;
  }

  return styled(styles)(
    <DataGridContext.Provider value={gridContext}>
      <DataGridSelectionContext.Provider value={gridSelectionContext}>
        <EditingContext.Provider value={editingContext}>
          <TableDataContext.Provider value={tableData}>
            <grid-container
              ref={setContainersRef}
              className="cb-react-grid-container"
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              onMouseDown={onMouseDownHandler}
              onMouseMove={onMouseMoveHandler}
            >
              <DataGrid
                ref={dataGridRef}
                className={`cb-react-grid-theme ${className}`}
                columns={tableData.columns}
                defaultColumnOptions={{
                  minWidth: 50,
                  resizable: true,
                  formatter: CellFormatter,
                }}
                rows={tableData.rows}
                rowKeyGetter={ResultSetDataKeysUtils.serialize}
                headerRowHeight={headerHeight}
                rowHeight={rowHeight}
                components={{
                  cellRenderer: CellRenderer,
                }}
                onSelectedCellChange={handleFocusChange}
                onColumnResize={(idx, width) => columnResize.execute({ column: idx, width })}
                onScroll={handleScroll}
              />
              <div ref={editorRef} />
            </grid-container>
          </TableDataContext.Provider>
        </EditingContext.Provider>
      </DataGridSelectionContext.Provider>
    </DataGridContext.Provider>
  );
});
