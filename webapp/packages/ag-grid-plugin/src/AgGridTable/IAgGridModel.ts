/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RowSelection } from './TableSelection/RowSelection';

export type AgGridRow = any[];

export type SortMode = 'asc' | 'desc' | null;

export interface IRequestDataOptions {
  sortMode?: SortMode[];
}


export interface IAgGridModel {
  initialRows: AgGridRow[];
  initialColumns: IAgGridCol[];
  chunkSize: number;
  enableRangeSelection?: boolean;

  actions: IAgGridActions | null;
  // hooks
  onRequestData(rowOffset: number, count: number, options?: IRequestDataOptions): Promise<IRequestedData>;
  onCellEditingStopped?(rowNumber: number, colNumber: number, value: any): void;
  onEditSave(): void;
  onEditCancel(): void;
}

export interface IAgGridActions {
  changeChunkSize(chunkSize: number): void;
  resetData(columns?: IAgGridCol[], rows?: AgGridRow[]): void;
  updateCellValue(rowNumber: number, colNumber: number, value: any): void;
  updateRowValue(rowNumber: number, value: any[]): void;
  getSelectedRows(): RowSelection[];
}

export interface IAgGridCol {
  icon?: string;
  label?: string;
  position?: number;
  dataKind?: string;
}

export interface IRequestedData {
  rows: AgGridRow[];
  columns?: IAgGridCol[];
  isFullyLoaded: boolean;
}
