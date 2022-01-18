/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';

export interface ITableViewerStorageChangeEventData {
  type: 'add' | 'remove';
  model: IDatabaseDataModel<any, any>;
}

@injectable()
export class TableViewerStorageService {
  readonly onChange: ISyncExecutor<ITableViewerStorageChangeEventData>;
  private tableModelMap: Map<string, IDatabaseDataModel<any, any>> = new Map();

  get values(): Array<IDatabaseDataModel<any, any>> {
    return Array.from(this.tableModelMap.values());
  }

  constructor() {
    this.onChange = new SyncExecutor();

    makeObservable<this, 'tableModelMap'>(this, {
      tableModelMap: observable.shallow,
      values: computed,
    });
  }

  has(tableId: string): boolean {
    return this.tableModelMap.has(tableId);
  }

  get<T extends IDatabaseDataModel<any, any>>(tableId: string): T | undefined {
    return this.tableModelMap.get(tableId) as any;
  }

  add<TOptions, TResult extends IDatabaseDataResult>(
    model: IDatabaseDataModel<TOptions, TResult>
  ): IDatabaseDataModel<TOptions, TResult> {
    this.tableModelMap.set(model.id, model);
    this.onChange.execute({
      type: 'add',
      model,
    });
    return model;
  }

  remove(id: string): void {
    const model = this.get(id);

    if (model) {
      this.onChange.execute({
        type: 'remove',
        model,
      });
      this.tableModelMap.delete(id);
    }
  }
}
