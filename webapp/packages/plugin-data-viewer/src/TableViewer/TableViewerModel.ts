/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, makeObservable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DetailsError, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { DatabaseDataAccessMode } from '../DatabaseDataModel/IDatabaseDataSource';
import { ErrorDialog } from './ErrorDialog';
import type { RowDiff } from './TableDataModel/EditedRow';
import type { TableColumn } from './TableDataModel/TableColumn';
import { TableDataModel } from './TableDataModel/TableDataModel';
import { TableEditor } from './TableDataModel/TableEditor';
import type { TableRow } from './TableDataModel/TableRow';

export const fetchingSettings = {
  fetchMin: 100,
  fetchMax: 5000,
  fetchDefault: 200,
};

export type AgGridRow = any[];

export type SortMode = 'asc' | 'desc' | null;

export type SortModel = Array<{
  colId: string;
  sort: SortMode;
}>;

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
  access?: DatabaseDataAccessMode;
  requestDataAsync: (
    model: TableViewerModel,
    rowOffset: number,
    count: number
  ) => Promise<IRequestDataResult>;
  saveChanges: (model: TableViewerModel, diffs: RowDiff[]) => Promise<IRequestDataResult>;
}

export interface IRequestDataResult {
  rows: TableRow[];
  columns: TableColumn[];
  isFullyLoaded: boolean;
  duration?: number;
  statusMessage: string;
}

export class TableViewerModel {
  access: DatabaseDataAccessMode;

  requestDataAsync: (
    model: TableViewerModel,
    rowOffset: number,
    count: number
  ) => Promise<IRequestDataResult>;

  _saveChanges: (model: TableViewerModel, diffs: RowDiff[]) => Promise<IRequestDataResult>;

  get isEmpty(): boolean {
    return this.tableDataModel.isEmpty();
  }

  get isFullyLoaded(): boolean {
    return !this._hasMoreRows;
  }

  getChunkSize = (): number => this._chunkSize;
  setChunkSize = (count: number): void => this.updateChunkSize(count);

  readonly tableDataModel = new TableDataModel();
  readonly tableEditor = new TableEditor(this.tableDataModel);
  readonly onReset: Observable<never>;
  readonly onChunkSizeChange: Observable<never>;

  private resetSubject: Subject<never>;
  private chunkChangeSubject: Subject<never>;
  private updating = false;
  private loading = false;

  private _hasMoreRows = true;
  private _chunkSize: number = this.getDefaultRowsCount();

  private sortedColumns = new MetadataMap<string, SqlDataFilterConstraint>(
    (colId, metadata) => ({ attribute: colId, orderPosition: metadata.count(), orderAsc: false })
  );

  constructor(
    options: ITableViewerModelOptions,
    private commonDialogService: CommonDialogService
  ) {
    makeObservable<TableViewerModel, '_hasMoreRows' | '_chunkSize' | 'updateChunkSize' | 'resetData'>(this, {
      access: observable,
      _hasMoreRows: observable,
      _chunkSize: observable,
      insertRows: action,
      setColumns: action,
      updateChunkSize: action,
      resetData: action,
    });

    this.access = options.access || DatabaseDataAccessMode.Default;
    this.requestDataAsync = options.requestDataAsync;
    this._saveChanges = options.saveChanges;
    this.resetSubject = new Subject();
    this.chunkChangeSubject = new Subject();
    this.onReset = this.resetSubject.asObservable();
    this.onChunkSizeChange = this.chunkChangeSubject.asObservable();
  }

  cancelFetch = (): void => { };

  refresh = (skipResetUpdate = false): void => {
    if (!skipResetUpdate && this.isUpdateLocked()) {
      return;
    }

    this.resetData();
    if (!skipResetUpdate) {
      this.resetSubject.next();
    }
  };

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

  insertRows(position: number, rows: TableRow[], hasMore: boolean): void {
    this.tableDataModel.insertRows(position, rows);
    this._hasMoreRows = hasMore;
  }

  setColumns(columns: TableColumn[]): void {
    this.tableDataModel.setColumns(columns);
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

        if (exception instanceof DetailsError) {
          hasDetails = exception.hasDetails();
          message = exception.errorMessage;
        }

        const state = await this.commonDialogService.open(
          ErrorDialog,
          {
            message,
            title: 'ui_data_saving_error',
            onShowDetails: hasDetails
              ? () => this.commonDialogService.open(ErrorDetailsDialog, exception)
              : undefined,
          }
        );

        if (state === DialogueStateResult.Rejected) {
          return;
        }
      }
    }
  }

  async onRequestData(rowOffset: number, count: number): Promise<IRequestedData> {
    // try to return data from cache
    if (!this.tableDataModel.isChunkLoaded(rowOffset, count) && !this.isFullyLoaded) {
      this.loading = true;

      try {
        const response = await this.requestDataAsync(this, rowOffset, count);

        this.insertRows(0, response.rows, !response.isFullyLoaded);
        if (!this.tableDataModel.getColumns().length) {
          this.tableDataModel.setColumns(response.columns);
        }
      } finally {
        this.loading = false;
      }
    }

    return {
      rows: this.tableDataModel.getChunk(rowOffset, count),
      columns: this.tableDataModel.getColumns(),
      isFullyLoaded: this.isFullyLoaded,
    };
  }

  onCellEditingStopped(rowNumber: number, column: string, value: any, editing: boolean): void {
    if (this.access === DatabaseDataAccessMode.Readonly) {
      return;
    }

    this.tableEditor.editCellValue(rowNumber, column, value, editing);
  }

  onSortChanged(sorting: SortModel): SortModel {
    if (this.isUpdateLocked()) {
      return this.getSortModel();
    }

    this.sortedColumns.clear();
    for (const sort of sorting) {
      this.setColumnSorting(sort.colId, sort.sort === 'asc', true);
    }
    this.refresh(true);
    return sorting;
  }

  getSortModel(): SortModel {
    return Array.from(this.sortedColumns.values()).map(v => ({
      colId: v.attribute,
      sort: v.orderAsc ? 'asc' : 'desc',
    }));
  }

  private isUpdateLocked(): boolean {
    if (this.updating || this.loading) {
      return true;
    }

    this.updating = true;
    setTimeout(() => { this.updating = false; }, 1000);
    return false;
  }

  private updateChunkSize(value: number) {
    this._chunkSize = this.getDefaultRowsCount(value);
    this.chunkChangeSubject.next();
  }

  private resetData() {
    this.tableDataModel.resetData();
    this.tableEditor.cancelChanges(true);
    this._hasMoreRows = true;
  }

  private async trySaveChanges(diffs: RowDiff[]) {
    const data = await this._saveChanges(this, diffs);

    this.tableEditor.applyChanges(data.rows);
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
