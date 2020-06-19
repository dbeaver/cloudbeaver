/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { ErrorDetailsDialog } from '@cloudbeaver/core-app';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { GQLError, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap } from '@cloudbeaver/core-utils';
import {
  IAgGridModel, IRequestedData, IRequestDataOptions, SortModel
} from '@cloudbeaver/plugin-ag-grid';

import { IExecutionContext } from '../IExecutionContext';
import { ErrorDialog } from './ErrorDialog';
import { RowDiff } from './TableDataModel/EditedRow';
import { TableColumn } from './TableDataModel/TableColumn';
import { TableDataModel } from './TableDataModel/TableDataModel';
import { TableEditor } from './TableDataModel/TableEditor';
import { SomeTableRows, TableRow } from './TableDataModel/TableRow';

export const fetchingSettings = {
  fetchMin: 1,
  fetchMax: 5000,
  fetchDefault: 200,
};

export interface IRequestDataResultOptions extends IRequestDataOptions {
  // to be extended, now just reexport to avoid ag-grid-plugin dependency
  sorting?: SortModel;
}

export interface ITableViewerModelOptions {
  tableId?: string;
  connectionId: string;
  containerNodePath?: string;
  resultId?: string | null; // will be filled after fist data fetch
  executionContext?: IExecutionContext | null; // will be filled before fist data fetch
  sourceName?: string; // TODO: refactor it, used for showing sql query for export
  noLoaderWhileRequestingDataAsync?: boolean;
  requestDataAsync(
    model: TableViewerModel,
    rowOffset: number,
    count: number
  ): Promise<IRequestDataResult>;
  saveChanges(model: TableViewerModel, diffs: RowDiff[]): Promise<IRequestDataResult>;
}

export interface IRequestDataResult {
  rows: TableRow[];
  columns: TableColumn[];
  isFullyLoaded: boolean;
  duration?: number;
  statusMessage: string;
}

export class TableViewerModel implements ITableViewerModelOptions {
  tableId: string;
  connectionId: string;
  containerNodePath?: string;
  resultId: string | null;
  executionContext: IExecutionContext | null;
  sourceName?: string;
  noLoaderWhileRequestingDataAsync?: boolean;
  requestDataAsync: (
    model: TableViewerModel,
    rowOffset: number,
    count: number
  ) => Promise<IRequestDataResult>;
  saveChanges: (model: TableViewerModel, diffs: RowDiff[]) => Promise<IRequestDataResult>;

  agGridModel: IAgGridModel = {
    chunkSize: this.getDefaultRowsCount(),
    enableRangeSelection: true,
    onRequestData: this.onRequestData.bind(this),
    onCellEditingStopped: this.onCellEditingStopped.bind(this),
    onEditSave: this.onSaveChanges.bind(this),
    onSortChanged: this.onSortChanged.bind(this),
    onEditCancel: this.onEditCancel.bind(this),
    actions: null, // to be set by ag-grid-plugin
  };

  get isEmpty() {
    return this.tableDataModel.isEmpty();
  }
  get isLoaderVisible() {
    return this._isLoaderVisible;
  }
  get isFullyLoaded() {
    return !this._hasMoreRows;
  }

  getChunkSize = () => this._chunkSize;
  setChunkSize = (count: number) => this.updateChunkSize(count);
  refresh = () => this.resetData();

  @observable queryDuration = 0;
  @observable requestStatusMessage = '';

  @observable errorMessage = '';
  @observable hasDetails = false;

  @observable private _hasMoreRows = true
  @observable private _isLoaderVisible = false;
  @observable private _chunkSize: number = this.getDefaultRowsCount();
  @observable private queryWhereFilter: string | null = null;

  private exception: GQLError | null = null;
  private tableDataModel = new TableDataModel();
  private tableEditor = new TableEditor(this.tableDataModel);
  private sortedColumns = new MetadataMap<string, SqlDataFilterConstraint>(
    (colId, metadata) => ({ attribute: colId, orderPosition: metadata.count(), orderAsc: false })
  );

  constructor(
    options: ITableViewerModelOptions,
    private commonDialogService: CommonDialogService
  ) {
    this.tableId = options.tableId || uuid();
    this.connectionId = options.connectionId;
    this.containerNodePath = options.containerNodePath;
    this.resultId = options.resultId || null;
    this.executionContext = options.executionContext || null;
    this.sourceName = options.sourceName;
    this.noLoaderWhileRequestingDataAsync = options.noLoaderWhileRequestingDataAsync;
    this.requestDataAsync = options.requestDataAsync;
    this.saveChanges = options.saveChanges;
  }

  cancelFetch = () => {
  }

  onShowDetails = () => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  }

  getQueryWhereFilter() {
    return this.queryWhereFilter;
  }

  setQueryWhereFilter(where: string | null) {
    this.queryWhereFilter = where;
  }

  applyQueryFilters() {
    this.resetData();
  }

  getSortedColumns() {
    return this.sortedColumns.values();
  }

  setColumnSorting(colId: string, orderAsc?: boolean, multiple?: boolean) {
    if (!multiple) {
      this.sortedColumns.clear();
    }

    const sorting = this.sortedColumns.get(colId);
    sorting.orderAsc = orderAsc;
  }

  removeColumnSorting(colId: string) {
    this.sortedColumns.delete(colId);
  }

  @action
  insertRows(position: number, rows: TableRow[], hasMore: boolean) {
    const isRowsAddition = this.tableDataModel.getRows().length < position + rows.length;
    this.tableDataModel.insertRows(position, rows);
    this._hasMoreRows = isRowsAddition ? hasMore : this._hasMoreRows;
  }

  @action
  setColumns(columns: TableColumn[]) {
    this.tableDataModel.setColumns(columns);
  }

  @action
  updateInfo(status: string, duration?: number) {
    this.queryDuration = duration || 0;
    this.requestStatusMessage = status;
  }

  private async onCellEditingStopped(rowNumber: number, colNumber: number, value: any): Promise<void> {
    this.tableEditor.editCellValue(rowNumber, colNumber, value);
  }

  private async onRequestData(rowOffset: number, count: number): Promise<IRequestedData> {
    // try to return data from cache
    if (this.tableDataModel.isChunkLoaded(rowOffset, count) || this.isFullyLoaded) {
      const data: IRequestedData = {
        rows: this.tableDataModel.getChunk(rowOffset, count),
        columns: this.tableDataModel.getColumns(),
        isFullyLoaded: this.isFullyLoaded,
      };
      return data;
    }

    this._isLoaderVisible = !this.noLoaderWhileRequestingDataAsync;

    try {
      const response = await this.requestDataAsync(this, rowOffset, count);

      this.insertRows(rowOffset, response.rows, !response.isFullyLoaded);
      if (!this.tableDataModel.getColumns().length) {
        this.tableDataModel.setColumns(response.columns);
      }
      this.clearErrors();
      this.updateInfo(response.statusMessage, response.duration);
      const data: IRequestedData = {
        rows: response.rows,
        columns: response.columns,
        isFullyLoaded: response.isFullyLoaded,
      };
      return data;

    } catch (e) {
      this.showError(e);
      throw e;
    } finally {
      this._isLoaderVisible = false;
    }
  }

  @action
  private updateChunkSize(value: number) {
    this._chunkSize = this.getDefaultRowsCount(value);
    this.agGridModel.actions?.changeChunkSize(this._chunkSize);
  }

  @action
  private resetData() {
    this.tableDataModel.resetData();
    this.agGridModel.actions?.resetData();
    this.requestStatusMessage = '';
    this.queryDuration = 0;
    this._hasMoreRows = true;
    this.errorMessage = '';
  }

  private updateAgGridRows(rows: SomeTableRows) {
    rows.forEach((row, rowNumber) => {
      this.agGridModel.actions?.updateRowValue(rowNumber, row);
    });
  }

  private onEditCancel() {
    const diffs = this.tableEditor.getChanges();
    this.revertChanges(diffs);
  }

  private async onSaveChanges(): Promise<void> {
    const diffs = this.tableEditor.getChanges();

    if (!diffs.length) {
      return;
    }

    while (true) {
      try {
        await this.trySaveChanges(diffs);
        return;
      } catch (exception) {
        let hasDetails = false;
        let message = `${exception.name}: ${exception.message}`;

        if (exception instanceof GQLError) {
          hasDetails = exception.hasDetails();
          message = exception.errorText;
        }

        const tryAgain = await this.commonDialogService.open(
          ErrorDialog,
          {
            message,
            onShowDetails: hasDetails
              ? () => this.commonDialogService.open(ErrorDetailsDialog, exception)
              : undefined,
          }
        );

        if (!tryAgain) {
          this.revertChanges(diffs);
          return;
        }
      }
    }
  }

  private onSortChanged(sorting: SortModel) {
    this.sortedColumns.clear();
    for (const sort of sorting) {
      this.setColumnSorting(sort.colId, sort.sort === 'asc', true);
    }
    this.resetData();
  }

  private async trySaveChanges(diffs: RowDiff[]) {
    this._isLoaderVisible = true;

    try {
      const data = await this.saveChanges(this, diffs);

      const someRows = this.zipDiffAndResults(diffs, data.rows);
      this.tableEditor.cancelChanges();
      this.tableDataModel.updateRows(someRows);
      this.updateAgGridRows(someRows);
      this.clearErrors();
      this.updateInfo(data.statusMessage, data.duration);

    } finally {
      this._isLoaderVisible = false;
    }
  }

  private revertChanges(diffs: RowDiff[]) {
    this.tableEditor.cancelChanges();
    // revert ag-grid
    const initialRows: SomeTableRows = new Map();
    for (const diff of diffs) {
      initialRows.set(diff.rowIndex, diff.source);
    }
    this.updateAgGridRows(initialRows);
  }

  /**
   * Take array of TableRow and return sparse array of TableRow
   *
   * @param diff
   * @param newRows
   */
  private zipDiffAndResults(diff: RowDiff[], newRows: TableRow[]): SomeTableRows {
    if (diff.length !== newRows.length) {
      throw new Error('expected that new rows have same length as diff');
    }
    const newRowsMap: SomeTableRows = new Map();

    for (let i = 0; i < diff.length; i++) {
      newRowsMap.set(diff[i].rowIndex, newRows[i]);
    }

    return newRowsMap;
  }

  private showError(exception: any) {
    this.exception = null;
    this.hasDetails = false;
    if (exception instanceof GQLError) {
      this.errorMessage = exception.errorText;
      this.exception = exception;
      this.hasDetails = exception.hasDetails();
    } else {
      this.errorMessage = `${exception.name}: ${exception.message}`;
    }
  }

  private clearErrors() {
    this.errorMessage = '';
  }

  private getDefaultRowsCount(count?: number) {
    return count
      ? Math.max(
        fetchingSettings.fetchMin,
        Math.min(count, fetchingSettings.fetchMax)
      )
      : fetchingSettings.fetchDefault;
  }
}
