/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Autowired,
  Bean,
  CellPosition,
  ColumnApi,
  Events,
  EventService,
  GridApi,
  GridOptionsWrapper,
  GridPanel,
  IRangeController,
  CellRangeParams,
  CellRange,
  RangeSelectionChangedEvent,
  RowPosition,
  PostConstruct,
  CellClickedEvent,
  ColumnController,
  Column,
  IRowModel,
  MouseEventService,
  _,
  AgGridEvent,
  CellPositionUtils,
  RowPositionUtils,
  ValueService,
} from '@ag-grid-community/core';

import { INDEX_COLUMN_DEF } from '../../AgGridTableController';
import {
  IAgColumnClickEvent, COLUMN_CLICK_EVENT_TYPE,
} from '../../TableColumnHeader/TableColumnHeader';
import { TableSelection } from '../../TableSelection/TableSelection';

interface CellKeyDownEvent extends AgGridEvent{
  event: KeyboardEvent;
}

const EVENT_KEY_CODE = {
  C: 67,
};

interface TemporarySelectionRange {
  firstRow: number;
  lastRow: number;
  columns: string[];
  isMultiple: boolean;
}

@Bean('rangeController')
export class RangeController implements IRangeController {
    @Autowired('cellPositionUtils') public cellPositionUtils!: CellPositionUtils;
    @Autowired('rowPositionUtils') public rowPositionUtils!: RowPositionUtils;
    @Autowired('valueService') private valueService!: ValueService;

    @Autowired('rowModel') private rowModel!: IRowModel;
    @Autowired('columnController') private columnController!: ColumnController;
    @Autowired('mouseEventService') private mouseEventService!: MouseEventService;
    @Autowired('columnApi') private columnApi!: ColumnApi;
    @Autowired('gridApi') private gridApi!: GridApi;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper!: GridOptionsWrapper;
    @Autowired('eventService') private eventService!: EventService;

    private lastSelectedCell?: CellPosition
    private isDragging = false;
    private isDraggingMultiple = false;
    private lastFocus: CellPosition | null = null
    private startDraggingCell: CellPosition | null = null
    private endDraggingCell: CellPosition | null = null
    private temporaryRange: TemporarySelectionRange | null = null
    private selection?: TableSelection
    private gridPanel!: GridPanel;

    registerGridComp(gridPanel: GridPanel): void {
      this.gridPanel = gridPanel;
    }

    @PostConstruct
    private init(): void {
      this.selection = this.gridOptionsWrapper.getContext()?.selection;

      if (this.selection) {
        this.eventService.addEventListener(Events.EVENT_CELL_KEY_DOWN, this.handleCellCopy.bind(this));
      }

      this.eventService.addEventListener(COLUMN_CLICK_EVENT_TYPE, this.selectColumn.bind(this));
      this.eventService.addEventListener(Events.EVENT_CELL_CLICKED, this.selectRow.bind(this));
    }

    private handleCellCopy(event: CellKeyDownEvent) {
      if (this.gridApi.getEditingCells().length > 0) {
        return;
      }
      this.handleDocumentCopy(event.event);
    }

    private handleDocumentCopy(event: KeyboardEvent) {
      if (event.keyCode === EVENT_KEY_CODE.C && event.ctrlKey) {
        this.copySelectedData();
      }
    }

    private copySelectedData() {
      const selectedRows = this.selection!.getSelectedRows();
      const selectedColumns = new Set<string>();

      for (const selectedRow of selectedRows) {
        for (const columnId of selectedRow.columns) {
          selectedColumns.add(columnId);
        }
      }

      const columns = this.columnController
        .getAllDisplayedColumns()
        .filter(column => selectedColumns.has(column.getColId()));

      let data = '';
      for (const selectedRow of selectedRows) {
        for (const column of columns) {
          if (column !== columns[0]) {
            data += '\t';
          }
          if (selectedRow.isSelected(column.getColId())) {
            const rowNode = this.rowPositionUtils.getRowNode({
              rowIndex: selectedRow.rowId,
              rowPinned: undefined,
            });
            const value = this.valueService.getValue(column, rowNode);
            data += value;
          }
        }
        data += '\r\n';
      }
      this.copyData(data);
    }

    private copyData(data: string) {
      const shadowElement = document.createElement('textarea');
      shadowElement.value = data;
      shadowElement.style.position = 'absolute';
      shadowElement.style.overflow = 'hidden';
      shadowElement.style.width = '0';
      shadowElement.style.height = '0';
      shadowElement.style.top = '0';
      shadowElement.style.left = '0';

      document.body.appendChild(shadowElement);
      shadowElement.select();
      document.execCommand('copy');
      document.body.removeChild(shadowElement);
      this.restoreFocus();
    }

    private selectColumn(event: IAgColumnClickEvent) {
      if (!this.selection) {
        return;
      }
      const lastRowId = this.gridApi.getInfiniteRowCount() - 1 - (this.rowModel.isLastRowFound() ? 0 : 1);
      if (event.columnId === INDEX_COLUMN_DEF.colId!) {
        this.selection.selectRange(
          0,
          lastRowId,
          this.getColumnsWithoutIndex(),
          event.isMultiple
        );
      } else {
        this.selection.selectRange(0, lastRowId, [event.columnId], event.isMultiple);
      }
      this.restoreFocus();
      this.dispatchChangedEvent(false, true);
    }

    private selectRow(event: CellClickedEvent) {
      if (!this.selection || (event.event as MouseEvent)?.shiftKey) {
        return;
      }

      if (event.column.getColId() === INDEX_COLUMN_DEF.colId) {
        this.selection.selectRange(
          event.rowIndex,
          event.rowIndex,
          this.getColumnsWithoutIndex(),
          (event.event as MouseEvent)?.ctrlKey
        );
        this.dispatchChangedEvent(false, true);
      }
    }

    setRangeToCell(cell: CellPosition, appendRange = false): void {
      if (!this.selection) {
        return;
      }
      this.lastSelectedCell = cell;
      this.lastFocus = cell;
      if (!this.gridOptionsWrapper.isEnableRangeSelection()
        || cell.column.getColId() === INDEX_COLUMN_DEF.colId) {
        return;
      }
      this.selection.selectCell(cell.rowIndex, cell.column.getColId(), appendRange);
      this.dispatchChangedEvent(false, true);
    }

    getCellRangeCount(cell: CellPosition): number {
      const columnId = cell.column.getColId();
      if (this.isCellInTemporaryRange(cell.rowIndex, columnId)) {
        const isRangeSelected = this.selection?.isRangeSelected(
          this.temporaryRange!.firstRow,
          this.temporaryRange!.lastRow,
          this.temporaryRange!.columns,
        );
        return isRangeSelected ? 0 : 1;
      }
      if (this.selection?.isCellSelected(cell.rowIndex, cell.column.getColId())) {
        return 1;
      }

      return 0;
    }

    extendLatestRangeToCell(position: CellPosition): void {
      if (!this.selection) {
        return;
      }
      const startRow = this.lastSelectedCell !== undefined ? this.lastSelectedCell.rowIndex : position.rowIndex;
      const endRow = position.rowIndex;
      let columns = this.getColumnsBetween((this.lastSelectedCell || position).column, position.column);
      const isRowsSelection = columns.includes(INDEX_COLUMN_DEF.colId!);

      if (isRowsSelection) {
        columns = this.getColumnsWithoutIndex();
      }

      this.selection.selectRange(
        startRow,
        endRow,
        columns,
        false
      );
      this.dispatchChangedEvent(false, true);
      this.lastSelectedCell = position;
      this.lastFocus = position;
    }

    getCellRanges(): CellRange[] {
      return [];
    }

    isCellInAnyRange(cell: CellPosition): boolean {
      return false;
    }

    isCellInSpecificRange(cell: CellPosition, range: CellRange): boolean {
      return false;
    }

    isEmpty(): boolean {
      return true;
    }

    removeAllCellRanges(silent?: boolean): void {
      this.selection?.clear();

      if (!silent) {
        this.dispatchChangedEvent(false, true);
      }
    }

    isMoreThanOneCell(): boolean {
      return false;
    }

    updateRangeEnd(cellRange: CellRange, cellPosition: CellPosition, silent?: boolean) {
      console.log('updateRangeEnd');
    }

    private dispatchChangedEvent(started: boolean, finished: boolean): void {
      const event: RangeSelectionChangedEvent = Object.freeze({
        type: Events.EVENT_RANGE_SELECTION_CHANGED,
        api: this.gridApi,
        columnApi: this.columnApi,
        started,
        finished,
      });

      this.eventService.dispatchEvent(event);
    }

    private getColumnsBetween(firstColumn: Column, secondColumn: Column): string[] {
      if (firstColumn === secondColumn) {
        return [firstColumn.getColId()];
      }

      const columns = this.columnController.getAllDisplayedColumns();
      const firstOffset = columns.indexOf(firstColumn);
      const secondOffset = columns.indexOf(secondColumn);

      if (firstOffset < 0 || secondOffset < 0) {
        return [];
      }

      const firstIndex = Math.min(firstOffset, secondOffset);
      const lastIndex = Math.max(firstOffset, secondOffset);

      return columns.slice(firstIndex, lastIndex + 1).map(column => column.getColId());
    }

    private getColumnsWithoutIndex() {
      return this.columnController
        .getAllDisplayedColumns()
        .map(column => column.getColId())
        .filter(column => column !== INDEX_COLUMN_DEF.colId!);
    }

    getRangeStartRow(cellRange: CellRange): RowPosition {
      return { rowIndex: 0, rowPinned: undefined };
    }

    getRangeEndRow(cellRange: CellRange): RowPosition {
      return { rowIndex: 0, rowPinned: undefined };
    }

    onDragStart(mouseEvent: MouseEvent): void {
      if (!this.selection) {
        return;
      }

      const startDraggingCell = this.mouseEventService.getCellPositionForEvent(mouseEvent);

      if (_.missing(startDraggingCell)) {
        return;
      }

      if (startDraggingCell.column.getColId() !== INDEX_COLUMN_DEF.colId) {
        this.selection.selectCell(
          startDraggingCell.rowIndex,
          startDraggingCell.column.getColId(),
          true,
          true
        );
      }
      this.isDragging = true;
      this.isDraggingMultiple = mouseEvent.ctrlKey;
      this.startDraggingCell = startDraggingCell;

      this.dispatchChangedEvent(true, false);
    }

    onDragging(mouseEvent: MouseEvent | null): void {
      if (!this.isDragging || !mouseEvent) {
        return;
      }

      const endDraggingCell = this.mouseEventService.getCellPositionForEvent(mouseEvent);

      if (_.missing(endDraggingCell)) {
        return;
      }

      this.endDraggingCell = endDraggingCell;

      this.updateDraggingSelection(true);
    }

    onDragStop(): void {
      if (!this.isDragging) {
        return;
      }

      this.updateDraggingSelection(false);
      this.isDragging = false;
      this.isDraggingMultiple = false;
      this.startDraggingCell = null;
      this.endDraggingCell = null;
    }

    private restoreFocus() {
      const scroll = this.gridPanel.getVScrollPosition();
      const nodes = this.gridApi.getRenderedNodes();
      const isFocusRendered = nodes.some(node => node.rowIndex === this.lastFocus?.rowIndex);

      if (this.lastFocus && isFocusRendered) {
        this.gridApi.setFocusedCell(this.lastFocus.rowIndex, this.lastFocus.column);
      } else {
        const node = nodes.find(node => node.isPixelInRange(scroll.top));
        const columns = this.columnController.getAllDisplayedColumns();

        if (nodes.length > 0 && columns.length > 0) {
          this.gridApi.setFocusedCell((node || nodes[0]).rowIndex, columns[0]);
        }
      }
    }

    private updateDraggingSelection(isExtends: boolean) {
      if (!this.selection || !this.startDraggingCell || !this.endDraggingCell) {
        return;
      }

      let columns = this.getColumnsBetween(this.startDraggingCell.column, this.endDraggingCell.column);
      const isRowsSelection = columns.includes(INDEX_COLUMN_DEF.colId!);
      const startRow = this.startDraggingCell.rowIndex;
      const endRow = this.endDraggingCell.rowIndex;

      if (isRowsSelection) {
        columns = this.getColumnsWithoutIndex();
      }
      const firstRow = Math.min(startRow, endRow);
      const lastRow = Math.max(startRow, endRow);

      this.temporaryRange = {
        firstRow,
        lastRow,
        columns,
        isMultiple: this.isDraggingMultiple,
      };

      if (!isExtends) {
        this.selection.selectRange(
          startRow,
          endRow,
          columns,
          this.isDraggingMultiple
        );
        this.clearTemporary();
      }

      this.dispatchChangedEvent(false, isExtends);
    }

    private clearTemporary() {
      this.temporaryRange = null;
    }

    private isCellInTemporaryRange(rowId: number, column: string) {
      if (!this.temporaryRange
        || this.temporaryRange.firstRow > rowId || this.temporaryRange.lastRow < rowId
        || !this.temporaryRange.columns.includes(column)
      ) {
        return false;
      }
      return true;
    }

    onColumnVisibleChange(): void {
      console.log('onColumnVisibleChange');
    }

    refreshLastRangeStart(): void {
      console.log('refreshLastRangeStart');
    }

    isLastCellOfRange(cellRange: CellRange, cell: CellPosition) {
      console.log('isLastCellOfRange');
      return false;
    }

    isBottomRightCell(cellRange: CellRange, cell: CellPosition): boolean {
      console.log('isBottomRightCell');
      return false;
    }

    isContiguousRange(cellRange: CellRange) {
      console.log('isContiguousRange');
      return false;
    }

    getRangeEdgeColumns(cellRange: CellRange) {
      console.log('getRangeEdgeColumns');
    }

    extendLatestRangeInDirection(key: number) {
      console.log('extendLatestRangeInDirection');
      return undefined;
    }

    setCellRange(params: CellRangeParams): void {
      console.log('extendLatestRangeInDirection');
    }

    setCellRanges(cellRanges: CellRange[]): void {
      console.log('setCellRanges', cellRanges);
    }

    createCellRangeFromCellRangeParams(params: CellRangeParams) {
      console.log('createCellRangeFromCellRangeParams');
      return undefined;
    }

    addCellRange(params: CellRangeParams): void {
      console.log('addCellRange', params);
    }

    getDraggingRange() {
      console.log('getDraggingRange');
    }
}
