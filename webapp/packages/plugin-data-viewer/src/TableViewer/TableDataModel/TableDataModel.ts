/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import type { TableColumn } from './TableColumn';
import type { CellValue, SomeTableRows, TableRow } from './TableRow';

/**
 * This model contains read-only data from a server database table.
 * Keep this data in consistence with server side. Don't try to modify this data if it is not inline with server changes
 */
export class TableDataModel {
  readonly onRowsUpdate: Observable<number[]>;

  private rowsUpdateSubject: Subject<number[]>;
  private rows: TableRow[] = [];
  private columns: TableColumn[] = [];

  constructor() {
    makeObservable(this, {
      resetData: action,
      updateRows: action,
      updateRow: action,
      updateCell: action,
      insertRows: action,
      setColumns: action,
    });

    this.rowsUpdateSubject = new Subject();
    this.onRowsUpdate = this.rowsUpdateSubject.asObservable();
  }

  getRows(): TableRow[] {
    return this.rows;
  }

  getColumns(): TableColumn[] {
    return this.columns;
  }

  isEmpty(): boolean {
    return this.columns.length === 0;
  }

  isChunkLoaded(offset: number, count: number): boolean {
    return (
      (this.rows.length > offset && !!this.rows[offset])
      && (this.rows.length > offset + count - 1 && !!this.rows[offset + count - 1])
    );
  }

  /**
   * returns shallow copy of cells of the chunk of rows
   */
  getChunk(offset: number, count: number): TableRow[] {
    return this.rows
      .slice(offset, offset + count)
      .map(row => ([...row]));
  }

  /**
   * returns shallow copy of a row
   */
  getRowByNumber(rowNumber: number): TableRow {
    if (!this.rows[rowNumber]) {
      throw new Error('index out of bound');
    }
    return [...this.rows[rowNumber]];
  }

  resetData(): void {
    this.rows = [];
    this.columns = [];
  }

  updateRows(newRows: SomeTableRows): void {
    for (const [key, row] of newRows) {
      this.updateRow(key, row);
    }
  }

  updateRow(rowIndex: number, value: TableRow): void {
    this.rows[rowIndex] = value;
    this.rowsUpdateSubject.next([rowIndex]);
  }

  updateCell(rowIndex: number, cellIndex: number, value: CellValue): void {
    const row = this.rows[rowIndex];
    if (row && cellIndex < row.length) {
      row[cellIndex] = value;
    }
  }

  insertRows(position: number, rows: TableRow[]): void {
    if (rows.length > 0) {
      if (position + rows.length > this.rows.length) {
        this.rows.length = position + rows.length;
      }

      this.rows.splice(position, rows.length, ...rows);
    }
  }

  setColumns(columns: TableColumn[]): void {
    this.columns = [...columns];
  }
}
