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
} from '@ag-grid-community/core';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import {
  TableViewerModel, SortModel, AgGridRow, IAgGridCol, DatabaseDataAccessMode
} from '@cloudbeaver/plugin-data-viewer';

import { AgGridContext } from './AgGridContext';
import { TableSelection } from './TableSelection/TableSelection';

@injectable()
export class AgGridTableController implements IInitializableController, IDestructibleController {
  @observable refreshId = 0;

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
  }

  /**
   * ag-grid options that is set and not changed during AgGridComponent lifetime
   */
  private readonly gridOptions: GridOptions = {
    defaultColDef: defaultColumnDef,

    rowHeight: 24,
    headerHeight: 28,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 0,
    cacheBlockSize: undefined, // to be set during init phase

    datasource: this.datasource,

    context: this.context,
    // maxBlocksInCache: 1,

    onGridReady: this.handleGridReady.bind(this),
    onBodyScroll: this.handleBodyScroll.bind(this),

    onSortChanged: this.handleSortChanged.bind(this),
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
  private subscriptions: Subscription[] = []

  init(gridModel: TableViewerModel) {
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

  getGridOptions() {
    return this.gridOptions;
  }

  refresh() {
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
      sortModel,
      failCallback,
    } = params;

    try {
      const length = endRow - startRow;
      const requestedData = await this.gridModel.onRequestData(startRow, length);
      // update columns only once after first data fetching
      if (isColumnsChanged(this.columns, requestedData.columns)) {
        this.columns = mapDataToColumns(requestedData.columns);
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
    this.gridModel.onSortChanged(sortModel);
  }

  /* Actions */

  private resetData(): void {
    this.selection.clear();
    if (this.api) {
      this.api.setInfiniteRowCount(0, false);
      this.api.purgeInfiniteCache(); // it will reset internal state
    }
  }

  private cloneRows(rows: AgGridRow[]): AgGridRow[] {
    return rows.map(row => [...row].map(v => (v === null ? '' : v))); // TODO: temporary fix dbeaver-corp/dbeaver-web#663
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

function mapDataToColumns(columns?: IAgGridCol[]): ColDef[] {
  if (!columns || !columns.length) {
    return [];
  }
  return [
    INDEX_COLUMN_DEF,
    ...columns.map((v, i) => ({
      colId: v.name,
      headerName: v.label,
      field: `${i}`,
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

        if (typeof value === 'object') {
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

        return params.value;
      },
      cellClass: (params: any) => {
        const context: AgGridContext = params.context;
        if (context.isCellEdited(params.node.rowIndex, params.colDef.colId)) {
          return 'cell-edited';
        }
        return '';

      },
    })),
  ];
}

function isColumnsChanged(oldColumns: ColDef[], newColumns: IAgGridCol[] = []): boolean {
  const [indexColumn, ...withoutIndexColumn] = oldColumns;
  if (withoutIndexColumn.length !== newColumns.length) {
    return true;
  }
  return withoutIndexColumn.some((col, ind) => col.colId !== newColumns[ind].name);
}
