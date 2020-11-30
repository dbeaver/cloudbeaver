/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { Subscription } from 'rxjs';

import {
  GridApi,
  ColumnApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  ColDef,
  ValueGetterParams,
  GridOptions,
  CellClassParams,
  SortChangedEvent,
  RowNode,
  CellEditingStoppedEvent
} from '@ag-grid-community/core';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import {
  TableViewerModel, SortModel, AgGridRow, IAgGridCol, DatabaseDataAccessMode
} from '@cloudbeaver/plugin-data-viewer';

import { AgGridContext } from './AgGridContext';
import { TableSelection } from './TableSelection/TableSelection';

/** title margin + type icon width + sort icon width + title margin right + box padding  */
const COLUMN_TITLE_BOX_WIDTH = 8 + 16 + 24 + 20 + 24;
/** row padding + sort icon width + right column title padding  */
const ROW_VALUE_BOX_WIDTH = 22 + 20 + 12;
/** how many rows we want to include to get column width  */
const ROWS_INCLUDE_IN_MEASUREMENTS = 100;
const MAX_WIDTH_COLUMN_PERCENT = 33;
const MAX_WIDTH_COLUMN_DEFAULT_VALUE = 300;

@injectable()
export class AgGridTableController implements IInitializableController, IDestructibleController {
  @observable refreshId = 0;
  gridContainer: HTMLElement | null = null;

  private readonly datasource: IDatasource = {
    getRows: this.getRows.bind(this),
  };

  private readonly selection = new TableSelection();

  /**
   * contains properties to pass to ag-grid
   */
  private readonly context: AgGridContext = {
    selection: this.selection,
    isReadonly: () => this.gridModel.access === DatabaseDataAccessMode.Readonly,
    isCellEdited: this.isCellEdited.bind(this),
    editCellValue: this.editCellValue.bind(this),
    revertCellValue: this.revertCellValue.bind(this),
    onEditSave: this.onEditSave.bind(this),
    onEditCancel: this.onEditCancel.bind(this),
  };

  /**
   * ag-grid options that is set and not changed during AgGridComponent lifetime
   */
  private readonly gridOptions: GridOptions = {
    defaultColDef: defaultColumnDef,

    rowHeight: 24,
    headerHeight: 28,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 0,
    maxConcurrentDatasourceRequests: 1,
    cacheBlockSize: undefined, // to be set during init phase

    datasource: this.datasource,

    context: this.context,
    // maxBlocksInCache: 1,

    onGridReady: this.handleGridReady.bind(this),
    onBodyScroll: this.handleBodyScroll.bind(this),

    onSortChanged: this.handleSortChanged.bind(this),
    onCellEditingStopped: this.handleCellEditingStopped.bind(this),
  };

  @observable columns: ColDef[] = [];

  /**
   * use this object to dynamically change ag-grid properties
   */
  @computed get dynamicOptions(): GridOptions {
    return {
      enableRangeSelection: !!this.selection,
    };
  }

  private api?: GridApi;
  private columnApi?: ColumnApi;
  private gridModel!: TableViewerModel;
  private resizeTask?: any;
  private subscriptions: Subscription[] = [];

  init(gridModel: TableViewerModel): void {
    this.gridModel = gridModel;
    this.gridOptions.cacheBlockSize = gridModel.getChunkSize();

    this.subscriptions.push(gridModel.tableDataModel.onRowsUpdate.subscribe(this.updateRows.bind(this)));
    this.subscriptions.push(gridModel.tableEditor.onRowsUpdate.subscribe(this.updateRows.bind(this)));
    this.subscriptions.push(gridModel.tableEditor.onCancelChanges.subscribe(this.cancelEditing.bind(this)));
    this.subscriptions.push(gridModel.onChunkSizeChange.subscribe(this.changeChunkSize.bind(this)));
    this.subscriptions.push(gridModel.onReset.subscribe(this.resetData.bind(this)));
  }

  destruct(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  getGridOptions(): GridOptions {
    return this.gridOptions;
  }

  refresh(): void {
    this.refreshId++;
  }

  /**
   * Part of Ag-grid IDataSource
   * Called by ag-grid when user scroll table and new portion of data is required
   * @param params
   */
  private async getRows(params: IGetRowsParams) {
    const {
      startRow,
      endRow,
      successCallback,
      failCallback,
    } = params;

    try {
      const length = endRow - startRow;
      const requestedData = await this.gridModel.onRequestData(startRow, length);
      // update columns only once after first data fetching
      if (isColumnsChanged(this.columns, requestedData.columns)) {
        this.columns = this.mapDataToColumns(requestedData.rows, requestedData.columns);
      }
      successCallback(
        this.cloneRows(requestedData.rows),
        requestedData.isFullyLoaded ? startRow + requestedData.rows.length : -1 // use -1 to tell ag-grid that we have more data
      );
    } catch (e) {
      failCallback();
    }
  }

  private changeChunkSize(): void {
    this.gridOptions.cacheBlockSize = this.gridModel.getChunkSize();
    // ag-grid is not able to change ca
    this.refresh();
  }

  private handleCellEditingStopped(event: CellEditingStoppedEvent) {
    this.gridModel.onCellEditingStopped(event.rowIndex, event.column.getId(), event.value, false);
  }

  private revertCellValue(rowIndex: number, colId: string) {
    this.gridModel.revertCellValue(rowIndex, colId);
  }

  private editCellValue(rowIndex: number, colId: string, value: any, editing: boolean) {
    this.gridModel.onCellEditingStopped(rowIndex, colId, value, editing);
  }

  private isCellEdited(rowIndex: number, column: string) {
    return this.gridModel.isCellEdited(rowIndex, column);
  }

  private cancelEditing() {
    if (this.api) {
      this.api.stopEditing(true);
    }
  }

  private updateRows(rows: number[]) {
    if (this.api) {
      const updatedRows: RowNode[] = [];

      for (const rowIndex of rows) {
        const rowNode = this.api.getRowNode(`${rowIndex}`);

        rowNode.setData([...this.gridModel.tableEditor.getRowValue(rowIndex)]);

        updatedRows.push(rowNode);
      }

      this.api.redrawRows({ rowNodes: updatedRows });
    }
  }

  private onEditSave() {
    this.gridModel.saveChanges();
  }

  private onEditCancel() {
    this.gridModel.cancelChanges();
  }

  private handleBodyScroll() {
    if (this.resizeTask !== undefined) {
      clearTimeout(this.resizeTask);
    }
    this.resizeTask = setTimeout(() => this.resizeIndexColumn(), 50);
  }

  private resizeIndexColumn() {
    if (this.columnApi) {
      this.columnApi.autoSizeColumns([INDEX_COLUMN_DEF.field!]);
    }
  }

  private handleGridReady(params: GridReadyEvent) {
    this.api = params.api;
    this.columnApi = params.columnApi;
  }

  private handleSortChanged(event: SortChangedEvent) {
    const sortModel = event.api.getSortModel() as SortModel;
    const newModel = this.gridModel.onSortChanged(sortModel);

    if (sortModel.length !== newModel.length) {
      event.api.setSortModel(newModel);
    } else {
      for (let i = 0; i < sortModel.length; i++) {
        if (sortModel[i].colId !== newModel[i].colId
          || sortModel[i].sort !== newModel[i].sort) {
          event.api.setSortModel(newModel);
          return;
        }
      }
    }
  }

  /* Actions */

  private resetData(): void {
    this.selection.clear();
    if (this.api) {
      this.api.purgeInfiniteCache(); // it will reset internal state
      this.api.setInfiniteRowCount(0, false);
    }
  }

  private cloneRows(rows: AgGridRow[]): AgGridRow[] {
    return rows.map(row => [...row]);
  }

  private measureText(text: string, title = false) {
    let font = '400 12px Roboto';

    if (this.gridContainer) {
      const fontTags = ['font-weight', 'font-size', 'font-family'];
      const styleDeclaration = window.getComputedStyle(this.gridContainer);
      const fontValues = fontTags.map(fontValue => fontValue === 'font-family' ? styleDeclaration.getPropertyValue(fontValue).split(',')[0] : styleDeclaration.getPropertyValue(fontValue));

      if (fontValues.filter(v => v !== '').length === fontTags.length) {
        font = fontValues.join(' ');
      }
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;

    return context.measureText(text.toUpperCase()).width + (title ? COLUMN_TITLE_BOX_WIDTH : ROW_VALUE_BOX_WIDTH);
  }

  private getColumnWidth(column: IAgGridCol, columnIdx: number, rows: AgGridRow) {
    const columnTitleWidth = this.measureText(column.name || '', true);
    const rowsToIncludeInMeasurements = Math.min(rows.length, ROWS_INCLUDE_IN_MEASUREMENTS);
    let longestRowValue = '';

    for (let i = 0; i < rowsToIncludeInMeasurements; i++) {
      // we need String to process NULL value
      const rowValue = String(rows[i][columnIdx]);
      if (rowValue.length > longestRowValue.length) {
        longestRowValue = rowValue;
      }
    }

    return Math.max(columnTitleWidth, this.measureText(longestRowValue));
  }

  private getMaxColumnWidth() {
    if (!this.gridContainer) {
      console.info('Can"t get grid container width, default value will be used');
      return MAX_WIDTH_COLUMN_DEFAULT_VALUE;
    }

    return Math.max(
      Math.round(this.gridContainer.getBoundingClientRect().width * MAX_WIDTH_COLUMN_PERCENT / 100),
      MAX_WIDTH_COLUMN_DEFAULT_VALUE
    );
  }

  private mapDataToColumns(rows: AgGridRow[], columns?: IAgGridCol[]): ColDef[] {
    if (!columns || !columns.length) {
      return [];
    }
    const columnMaxWidth = this.getMaxColumnWidth();
    return [
      INDEX_COLUMN_DEF,
      ...columns.map((v, i) => ({
        colId: v.name,
        headerName: v.label,
        field: `${i}`,
        width: Math.min(this.getColumnWidth(v, i, rows), columnMaxWidth),
        // type: v.dataKind,
        editable: (params: any) => {
          const context: AgGridContext = params.context;
          return !(context.isReadonly() || v.readOnly);
        },
        valueGetter: (params: ValueGetterParams) => {
          if (!params.data) {
            return '';
          }
          const value = params.data[params.colDef.field || 'node.id'];

          if (value !== null && typeof value === 'object') {
            return JSON.stringify(value);
          }

          return value;
        },
        headerComponentParams: {
          icon: v.icon,
        },
        cellRenderer: (params: CellClassParams) => {
          if (typeof params.value === 'string' && params.value.length > 1000) {
            return params.value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
          }

          if (params.value === null) {
            return '[null]';
          }

          return params.value;
        },
        cellClass: (params: any) => {
          const classes: string[] = [];
          const context: AgGridContext = params.context;
          if (context.isCellEdited(params.node.rowIndex, params.colDef.colId)) {
            classes.push('cell-edited');
          }
          if (params.value === null) {
            classes.push('cell-null');
          }
          return classes.join(' ');
        },
      })
      ),
    ];
  }
}

const defaultColumnDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  editable: true,
  cellEditor: 'plainTextEditor',
};

export const INDEX_COLUMN_DEF: ColDef = {
  headerName: '#',
  colId: `${Number.MAX_SAFE_INTEGER}`,
  field: `${Number.MAX_SAFE_INTEGER}`,
  width: 70,
  pinned: 'left',
  suppressNavigable: true,
  suppressMenu: true,
  editable: false,
  sortable: false,
  valueGetter: props => props.node.rowIndex + 1,
  cellRendererSelector: props => ({ component: !props.data ? 'indexCellRenderer' : undefined }),
};

function isColumnsChanged(oldColumns: ColDef[], newColumns: IAgGridCol[] = []): boolean {
  // maybe better to filter based on INDEX_COLUMN_DEF
  const withoutIndexColumn = oldColumns.slice(1);

  if (withoutIndexColumn.length !== newColumns.length) {
    return true;
  }

  return withoutIndexColumn.some((col, ind) => col.colId !== newColumns[ind].name);
}
