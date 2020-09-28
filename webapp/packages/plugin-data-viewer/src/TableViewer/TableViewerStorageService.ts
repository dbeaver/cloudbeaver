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

import { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';
import { IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';
import { DataModelWrapper } from './DataModelWrapper';
import { ITableViewerModelOptions } from './TableViewerModel';

@injectable()
export class TableViewerStorageService {
  @observable private tableModelMap: Map<string, IDatabaseDataModel<any, any>> = new Map();

  constructor(private commonDialogService: CommonDialogService) {}

  has(tableId: string): boolean {
    return this.tableModelMap.has(tableId);
  }

  get(tableId: string): DataModelWrapper | null | undefined {
    return this.tableModelMap.get(tableId) as DataModelWrapper;
  }

  /**
   * @deprecated Use add method instead
   */
  create(
    options: ITableViewerModelOptions,
    source: IDatabaseDataSource<any, any>
  ): DataModelWrapper {

    return this.add(new DataModelWrapper(
      this.commonDialogService,
      options,
      source
    )) as DataModelWrapper;
  }

  add<TOptions, TResult extends IDatabaseDataResult>(
    model: IDatabaseDataModel<TOptions, TResult>,
  ): IDatabaseDataModel<TOptions, TResult> {
    this.tableModelMap.set(model.id, model);
    return this.tableModelMap.get(model.id)!;
  }

  remove(id: string): void {
    this.tableModelMap.delete(id);
  }
}
