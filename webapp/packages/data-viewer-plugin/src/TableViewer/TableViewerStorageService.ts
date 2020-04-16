/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';

import { TableViewerModel } from './TableViewerModel';

// todo this service must be removed. Store TableViewerModel directly where it is required
@injectable()
export class TableViewerStorageService {
  @observable private tableModelMap: Map<string, TableViewerModel> = new Map();

  hasTableModel(tableId: string): boolean {
    return this.tableModelMap.has(tableId);
  }
  getTableModel(tableId: string) {
    return this.tableModelMap.get(tableId);
  }

  addTableModel(tableId: string, tableModel: TableViewerModel) {
    this.tableModelMap.set(tableId, tableModel);
  }

  removeTableModel(tableId: string) {
    this.tableModelMap.delete(tableId);
  }
}
