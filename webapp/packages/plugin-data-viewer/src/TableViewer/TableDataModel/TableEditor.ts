/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { EditedRow, RowDiff } from './EditedRow';
import { TableDataModel } from './TableDataModel';
import { TableRow, SomeTableRows } from './TableRow';

/**
 *  when user edit data in e table this class store changes until they will be applied
 */
export class TableEditor {
  readonly onRowsUpdate: Observable<number[]>
  readonly onCancelChanges: Observable<null>

  @observable private editedRows = new Map<number, EditedRow>();
  private rowsUpdateSubject: Subject<number[]>
  private cancelChangesSubject: Subject<null>

  constructor(private dataModel: TableDataModel) {
    this.rowsUpdateSubject = new Subject();
    this.cancelChangesSubject = new Subject();
    this.onRowsUpdate = this.rowsUpdateSubject.asObservable();
    this.onCancelChanges = this.cancelChangesSubject.asObservable();
  }

  /**
   * this method doesn't modify TableRow but create a diff that can be applied later
   */
  editCellValue(rowId: number, columnKey: string, value: any, editing: boolean) {
    const column = this.dataModel
      .getColumns()
      .find(column => column.name === columnKey);

    if (!column) {
      return;
    }

    const newValue = this.getOrCreateEditedRow(rowId)
      .setValue(column.position, value);

    if (!editing) {
      this.rowsUpdateSubject.next([rowId]);
    }
    return newValue;
  }

  revertCellValue(rowId: number, columnKey: string) {
    const column = this.dataModel
      .getColumns()
      .find(column => column.name === columnKey);

    if (!column) {
      return;
    }

    const newValue = this.getOrCreateEditedRow(rowId)
      .revert(column.position);

    this.rowsUpdateSubject.next([rowId]);
    return newValue;
  }

  getRowValue(rowId: number) {
    const editedRow = this.editedRows.get(rowId);
    if (!editedRow) {
      return this.dataModel.getRowByNumber(rowId);
    }

    return editedRow.newRow;
  }

  isEdited(): boolean {
    return Array.from(this.editedRows.values())
      .some(row => row.isEdited());
  }

  isRowEdited(rowId: number) {
    const editedRow = this.editedRows.get(rowId);
    if (!editedRow) {
      return false;
    }

    return editedRow.isEdited();
  }

  isCellEdited(rowId: number, columnKey: string) {
    const editedRow = this.editedRows.get(rowId);
    if (!editedRow) {
      return false;
    }

    const column = this.dataModel
      .getColumns()
      .find(column => column.name === columnKey);

    if (!column) {
      return false;
    }

    return editedRow.isCellEdited(column.position);
  }

  getChanges(): RowDiff[] {
    return Array.from(this.editedRows.values())
      .filter(editedRow => editedRow.isEdited())
      .map(editedRow => editedRow.getDiff());
  }

  applyChanges(rows: TableRow[]) {
    const diffs = this.getChanges();
    this.editedRows.clear();
    this.dataModel.updateRows(this.zipDiffAndResults(diffs, rows));
  }

  cancelChanges(skipUpdate?: boolean) {
    const rows = Array.from(this.editedRows.keys());
    this.editedRows.clear();
    if (!skipUpdate) {
      this.cancelChangesSubject.next(null);
      this.rowsUpdateSubject.next(rows);
    }
  }

  private getOrCreateEditedRow(rowId: number): EditedRow {
    if (!this.editedRows.has(rowId)) {
      this.editedRows.set(
        rowId,
        new EditedRow(rowId, this.dataModel.getRowByNumber(rowId))
      );
    }

    return this.editedRows.get(rowId)!;
  }

  /**
   * Take array of TableRow and return sparse array of TableRow
   *
   * @param diff
   * @param newRows
   */
  private zipDiffAndResults(diff: RowDiff[], newRows: TableRow[]): SomeTableRows {
    const length = Math.min(diff.length, newRows.length);
    if (diff.length !== newRows.length) {
      console.warn('Expected that new rows have same length as diff');
    }
    const newRowsMap: SomeTableRows = new Map();

    for (let i = 0; i < length; i++) {
      newRowsMap.set(diff[i].rowIndex, newRows[i]);
    }

    return newRowsMap;
  }
}
