/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, type HTMLAttributes } from 'react';

import { getComputed, useHover, useMergeRefs, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { clsx } from '@dbeaver/ui-kit';
import { type IDataGridCellRenderer, type ICellPosition } from '@cloudbeaver/plugin-data-grid';
import {
  DatabaseEditChangeType,
  GridDataKeysUtils,
  KEY_BINDING_OPEN_CELL_CONTEXT_MENU,
  type IGridDataKey,
  type IGridRowKey,
} from '@cloudbeaver/plugin-data-viewer';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import { ColumnDnDContext } from '../ColumnDnDContext.js';
import { DataGridContext } from '../DataGridContext.js';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext.js';
import { TableDataContext, type IColumnInfo } from '../TableDataContext.js';
import { CellContext } from './CellContext.js';
import { TableMenuContext } from './TableMenuContext.js';
import { useDataEditorDnDBox } from '../useDataEditorDnDBox.js';
import { getDropSide } from '../getDropSide.js';
import { isBindingPressed } from '@cloudbeaver/core-view';

interface Props {
  rowIdx: number;
  colIdx: number;
  props: HTMLAttributes<HTMLDivElement>;
  renderDefaultCell: IDataGridCellRenderer;
}

export const CellRenderer = observer<Props>(function CellRenderer({ rowIdx, colIdx, props, renderDefaultCell }) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const columnDnDContext = useContext(ColumnDnDContext);
  const columnInfo = tableDataContext.getColumn(colIdx);
  const dndBox = useDataEditorDnDBox(dataGridContext.model, dataGridContext.resultIndex, columnInfo?.key ?? null);

  const tableMenuContext = useContext(TableMenuContext);
  const hover = useHover();

  const cellContext = useObservableRef(
    () => ({
      get isMenuVisible(): boolean {
        const activeKey = this.tableMenuContext.activeCellKey;
        if (!activeKey || !this.cell) {
          return false;
        }

        return GridDataKeysUtils.isElementsKeyEqual(activeKey, this.cell);
      },
      isFocused: false,
      isHovered: false,
      get position(): ICellPosition {
        return { colIdx: this.colIdx, rowIdx: this.rowIdx };
      },
      get column(): IColumnInfo {
        return this.tableDataContext.getColumn(this.colIdx)!;
      },
      get row(): IGridRowKey | undefined {
        return this.tableDataContext.getRow(this.rowIdx);
      },
      get cell(): IGridDataKey | undefined {
        if (this.column.key === null || this.row === undefined) {
          return undefined;
        }
        return { row: this.row, column: this.column.key };
      },
      get isSelected(): boolean {
        return this.selectionContext.isSelected(this.position.rowIdx, this.position.colIdx) || false;
      },
      get editionState(): DatabaseEditChangeType | null {
        if (!this.cell) {
          return null;
        }

        return this.tableDataContext.getEditionState(this.cell);
      },

      setMenuVisibility(visible: boolean): void {
        if (visible && this.cell) {
          const rect = (
            document.querySelector(`[data-row-index="${this.rowIdx}"][data-column-index="${this.colIdx}"]`) as HTMLElement | null
          )?.getBoundingClientRect();
          this.tableMenuContext.openMenu(this.cell, rect ? rect.right - 20 : 0, rect ? rect.bottom : 0);
        } else {
          this.tableMenuContext.closeMenu();
        }
      },
    }),
    {
      colIdx: observable.ref,
      rowIdx: observable.ref,
      isFocused: observable.ref,
      isHovered: observable.ref,
      row: computed,
      column: computed,
      position: computed,
      cell: computed,
      isSelected: computed,
      editionState: computed,
      isMenuVisible: computed,
      tableDataContext: observable.ref,
      selectionContext: observable.ref,
      tableMenuContext: observable.ref,
      hover: observable.ref,
    },
    {
      colIdx,
      rowIdx,
      tableDataContext,
      selectionContext,
      tableMenuContext,
      hover,
      isFocused: props['aria-selected'] === 'true',
      isHovered: hover.isHovered,
    },
  );

  const dropSide = getComputed(() => getDropSide(columnInfo, columnDnDContext));
  const classes = getComputed(() =>
    clsx({
      'rdg-cell-custom-selected': cellContext.isSelected,
      'rdg-cell-custom-added': cellContext.editionState === DatabaseEditChangeType.add,
      'rdg-cell-custom-deleted': cellContext.editionState === DatabaseEditChangeType.delete,
      'rdg-cell-custom-edited': cellContext.editionState === DatabaseEditChangeType.update,
      'rdg-cell-column-drop-left': dropSide === 'left',
      'rdg-cell-column-drop-right': dropSide === 'right',
    }),
  );

  const state = useObjectRef(
    () => ({
      mouseUp(event: React.MouseEvent<HTMLDivElement>) {
        if (
          // !this.dataGridContext.isGridInFocus()
          EventContext.has(event, EventStopPropagationFlag) ||
          // Preventing selection being reset on right-click
          event.button === 2
        ) {
          return;
        }

        const isCurrentCellSelected = this.selectionContext.isSelected(this.rowIdx, this.colIdx);
        const isModifyingSelection = event.ctrlKey || event.metaKey || event.shiftKey;
        const hasSelection = this.selectionContext.selectedCells.size > 0;

        if (!isCurrentCellSelected || isModifyingSelection) {
          this.selectionContext.select(
            {
              colIdx: this.colIdx,
              rowIdx: this.rowIdx,
            },
            event.ctrlKey || event.metaKey,
            event.shiftKey,
            false,
          );
          return;
        }

        if (hasSelection) {
          this.selectionContext.clearSelection();
        }
      },
      keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (isBindingPressed(event, KEY_BINDING_OPEN_CELL_CONTEXT_MENU)) {
          event.preventDefault();
          event.stopPropagation();
          this.cellContext.setMenuVisibility(!this.cellContext.isMenuVisible);
        }
      },
      openContextMenu(event: React.MouseEvent<HTMLDivElement>) {
        if (EventContext.has(event, EventStopPropagationFlag)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        // If the right-clicked cell is not in the current selection, select only this cell
        const isCurrentCellSelected = this.selectionContext.isSelected(this.rowIdx, this.colIdx);

        if (!isCurrentCellSelected) {
          this.selectionContext.select(
            {
              colIdx: this.colIdx,
              rowIdx: this.rowIdx,
            },
            false,
            false,
            false,
          );
        }

        this.cellContext.setMenuVisibility(true);
      },
    }),
    {
      colIdx,
      rowIdx,
      selectionContext,
      dataGridContext,
      cellContext,
      tableMenuContext,
    },
    ['keyDown', 'mouseUp', 'openContextMenu'],
  );

  const formatting = getComputed(
    () => (cellContext.cell !== undefined ? tableDataContext.formatting.getFormatting(cellContext.cell) : null),
    isObjectsEqual,
  );

  const mergedRef = useMergeRefs(dndBox.setRef, hover.ref);

  return (
    <CellContext.Provider value={cellContext}>
      {renderDefaultCell({
        ref: mergedRef,
        className: classes,
        style: formatting || undefined,
        'data-row-index': rowIdx,
        'data-column-index': colIdx,
        onKeyDown: state.keyDown,
        onMouseUp: state.mouseUp,
        onContextMenu: state.openContextMenu,
      })}
    </CellContext.Provider>
  );
});
