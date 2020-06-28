/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { EditedRow, RowDiff } from './EditedRow';
import { TableDataModel } from './TableDataModel';

/**
 *  when user edit data in e table this class store changes until they will be applied
 */
export class TableEditor {

  @observable private editedRows = new Map<number, EditedRow>();

  constructor(private dataModel: TableDataModel) {
  }

  /**
   * this method doesn't modify TableRow but create a diff that can be applied later
   */
  editCellValue(rowId: number, columnKey: string, value: any) {
    const column = this.dataModel
      .getColumns()
      .find(column => column.name === columnKey);

    if (!column) {
      return;
    }

    this.getOrCreateEditedRow(rowId)
      .setValue(column.position, value);
  }

  isEdited(): boolean {
    return Array.from(this.editedRows.values())
      .some(row => row.isEdited());
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

  applyChanges() {
    // todo
    this.editedRows.clear();
  }

  cancelChanges() {
    this.editedRows.clear();
  }

  private getOrCreateEditedRow(rowId: number): EditedRow {
    let editedRow = this.editedRows.get(rowId);

    if (!editedRow) {
      editedRow = new EditedRow(rowId, this.dataModel.getRowByNumber(rowId));
      this.editedRows.set(rowId, editedRow);
    }

    return editedRow;
  }

}
