/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { TableViewerModel, ITableViewerModelOptions } from './TableViewerModel';

@injectable()
export class TableViewerStorageService {
  @observable private tableModelMap: Map<string, TableViewerModel> = new Map();

  constructor(private commonDialogService: CommonDialogService) {}

  has(tableId: string): boolean {
    return this.tableModelMap.has(tableId);
  }
  get(tableId: string) {
    return this.tableModelMap.get(tableId);
  }

  create(
    options: ITableViewerModelOptions,
  ): TableViewerModel {

    const tableModel = new TableViewerModel(options, this.commonDialogService);
    this.tableModelMap.set(tableModel.tableId, tableModel);
    return tableModel;
  }

  remove(tableId: string) {
    this.tableModelMap.delete(tableId);
  }
}
