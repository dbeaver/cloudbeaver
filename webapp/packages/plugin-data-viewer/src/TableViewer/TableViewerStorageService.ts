/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';
import type { IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';
import { DataModelWrapper } from './DataModelWrapper';

@injectable()
export class TableViewerStorageService {
  private tableModelMap: Map<string, IDatabaseDataModel<any, any>> = new Map();

  get values(): Array<IDatabaseDataModel<any, any>> {
    return Array.from(this.tableModelMap.values());
  }

  constructor() {
    makeObservable<this, 'tableModelMap'>(this, {
      tableModelMap: observable,
      values: computed,
    });
  }

  has(tableId: string): boolean {
    return this.tableModelMap.has(tableId);
  }

  get<T extends IDatabaseDataModel<any, any>>(tableId: string): T | undefined {
    return this.tableModelMap.get(tableId) as any;
  }

  /**
   * @deprecated Use add method instead
   */
  create(
    source: IDatabaseDataSource<any, any>
  ): DataModelWrapper {
    return this.add(new DataModelWrapper(source)) as DataModelWrapper;
  }

  add<TOptions, TResult extends IDatabaseDataResult>(
    model: IDatabaseDataModel<TOptions, TResult>
  ): IDatabaseDataModel<TOptions, TResult> {
    this.tableModelMap.set(model.id, model);
    return this.tableModelMap.get(model.id)!;
  }

  remove(id: string): void {
    this.tableModelMap.delete(id);
  }
}
