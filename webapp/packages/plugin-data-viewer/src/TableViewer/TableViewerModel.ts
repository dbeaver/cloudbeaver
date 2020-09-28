/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLError, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap } from '@cloudbeaver/core-utils';

import { DatabaseDataAccessMode } from '../DatabaseDataModel/IDatabaseDataModel';
import { IExecutionContext } from '../IExecutionContext';
import { ErrorDialog } from './ErrorDialog';
import { RowDiff } from './TableDataModel/EditedRow';
import { TableColumn } from './TableDataModel/TableColumn';
import { TableDataModel } from './TableDataModel/TableDataModel';
import { TableEditor } from './TableDataModel/TableEditor';
import { TableRow } from './TableDataModel/TableRow';

export const fetchingSettings = {
  fetchMin: 1,
  fetchMax: 5000,
  fetchDefault: 200,
};

export type AgGridRow = any[];

export type SortMode = 'asc' | 'desc' | null;

export type SortModel = {
  colId: string;
  sort: SortMode;
}[];

export interface IRequestDataOptions {
  sorting?: SortModel;
}

export interface IAgGridCol {
  icon?: string;
  label?: string;
  name?: string;
  dataKind?: string;
  readOnly: boolean;
}

export interface IRequestedData {
  rows: AgGridRow[];
  columns?: IAgGridCol[];
  isFullyLoaded: boolean;
}

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
  access?: DatabaseDataAccessMode;
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

export class TableViewerModel {
  tableId: string;
  connectionId: string;
  containerNodePath?: string;
  resultId: string | null;
  executionContext: IExecutionContext | null;
  sourceName?: string;
  noLoaderWhileRequestingDataAsync?: boolean;

  @observable access: DatabaseDataAccessMode;

  requestDataAsync: (
    model: TableViewerModel,
    rowOffset: number,
    count: number
  ) => Promise<IRequestDataResult>;
  _saveChanges: (model: TableViewerModel, diffs: RowDiff[]) => Promise<IRequestDataResult>;

  get isEmpty(): boolean {
    return this.tableDataModel.isEmpty();
  }
  get isLoaderVisible(): boolean {
    return this._isLoaderVisible;
  }
  get isFullyLoaded(): boolean {
    return !this._hasMoreRows;
  }

  getChunkSize = (): number => this._chunkSize;
  setChunkSize = (count: number): void => this.updateChunkSize(count);

  @observable queryDuration = 0;
  @observable requestStatusMessage = '';

  @observable errorMessage = '';
  @observable hasDetails = false;

  readonly tableDataModel = new TableDataModel();
  readonly tableEditor = new TableEditor(this.tableDataModel);
  readonly onReset: Observable<never>;
  readonly onChunkSizeChange: Observable<never>;

  private resetSubject: Subject<never>
  private chunkChangeSubject: Subject<never>

  @observable private _hasMoreRows = true
  @observable private _isLoaderVisible = false;
  @observable private _chunkSize: number = this.getDefaultRowsCount();
  @observable private queryWhereFilter: string | null = null;

  private exception: GQLError | null = null;
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
    this.access = options.access || DatabaseDataAccessMode.Default;
    this.requestDataAsync = options.requestDataAsync;
    this._saveChanges = options.saveChanges;
    this.resetSubject = new Subject();
    this.chunkChangeSubject = new Subject();
    this.onReset = this.resetSubject.asObservable();
    this.onChunkSizeChange = this.chunkChangeSubject.asObservable();
  }

  cancelFetch = (): void => { }

  refresh = async (): Promise<void> => {
    this.resetData();
    await this.onRequestData(0, this.getChunkSize());
    this.resetSubject.next();
  }

  onShowDetails = (): void => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  }

  getQueryWhereFilter(): string | null {
    return this.queryWhereFilter;
  }

  setQueryWhereFilter(where: string | null): void {
    this.queryWhereFilter = where;
  }

  getSortedColumns(): IterableIterator<SqlDataFilterConstraint> {
    return this.sortedColumns.values();
  }

  setColumnSorting(colId: string, orderAsc?: boolean, multiple?: boolean): void {
    if (!multiple) {
      this.sortedColumns.clear();
    }

    const sorting = this.sortedColumns.get(colId);
    sorting.orderAsc = orderAsc;
  }

  removeColumnSorting(colId: string): void {
    this.sortedColumns.delete(colId);
  }

  @action
  insertRows(position: number, rows: TableRow[], hasMore: boolean): void {
    const isRowsAddition = this.tableDataModel.getRows().length < position + rows.length;
    this.tableDataModel.insertRows(position, rows);
    this._hasMoreRows = isRowsAddition ? hasMore : this._hasMoreRows;
  }

  @action
  setColumns(columns: TableColumn[]): void {
    this.tableDataModel.setColumns(columns);
  }

  @action
  updateInfo(status: string, duration?: number): void {
    this.queryDuration = duration || 0;
    this.requestStatusMessage = status;
  }

  isEdited(): boolean {
    if (this.access === DatabaseDataAccessMode.Readonly) {
      return false;
    }

    return this.tableEditor.isEdited();
  }

  isCellEdited(rowIndex: number, column: string): boolean {
    return this.tableEditor.isCellEdited(rowIndex, column);
  }

  revertCellValue(rowNumber: number, column: string): void {
    this.tableEditor.revertCellValue(rowNumber, column);
  }

  cancelChanges(): void {
    this.tableEditor.cancelChanges();
  }

  async saveChanges(): Promise<void> {
    if (this.access === DatabaseDataAccessMode.Readonly) {
      return;
    }

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
          return;
        }
      }
    }
  }

  async onRequestData(rowOffset: number, count: number): Promise<IRequestedData> {
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

  onCellEditingStopped(rowNumber: number, column: string, value: any, editing: boolean): void {
    if (this.access === DatabaseDataAccessMode.Readonly) {
      return;
    }

    this.tableEditor.editCellValue(rowNumber, column, value, editing);
  }

  onSortChanged(sorting: SortModel): void {
    this.sortedColumns.clear();
    for (const sort of sorting) {
      this.setColumnSorting(sort.colId, sort.sort === 'asc', true);
    }
    this.refresh();
  }

  @action
  private updateChunkSize(value: number) {
    this._chunkSize = this.getDefaultRowsCount(value);
    this.chunkChangeSubject.next();
  }

  @action
  private resetData() {
    this.tableDataModel.resetData();
    this.tableEditor.cancelChanges(true);
    this.requestStatusMessage = '';
    this.queryDuration = 0;
    this._hasMoreRows = true;
    this.errorMessage = '';
  }

  private async trySaveChanges(diffs: RowDiff[]) {
    this._isLoaderVisible = true;

    try {
      const data = await this._saveChanges(this, diffs);

      this.tableEditor.applyChanges(data.rows);
      this.clearErrors();
      this.updateInfo(data.statusMessage, data.duration);

    } finally {
      this._isLoaderVisible = false;
    }
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
