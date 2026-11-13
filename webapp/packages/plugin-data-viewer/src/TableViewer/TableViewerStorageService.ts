/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { type IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource.js';
import type { IDataViewerTableStorage } from '../IDataViewerTableStorage.js';

export interface ITableViewerStorageChangeEventData {
  type: 'add' | 'remove';
  model: IDatabaseDataModel<any>;
}

export class TableViewerStorageServiceImpl implements IDataViewerTableStorage {
  readonly onChange: ISyncExecutor<ITableViewerStorageChangeEventData>;
  private readonly tableModelMap: Map<string, IDatabaseDataModel<any>> = new Map();

  get values(): Array<IDatabaseDataModel<any>> {
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

  get<T extends IDatabaseDataModel<any> = IDatabaseDataModel>(tableId: string): T | undefined {
    return this.tableModelMap.get(tableId) as any;
  }

  add<TSource extends IDatabaseDataSource<any, any> = IDatabaseDataSource>(model: IDatabaseDataModel<TSource>): IDatabaseDataModel<TSource> {
    if (this.tableModelMap.has(model.id)) {
      return model;
    }

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

export type TableViewerStorageService = TableViewerStorageServiceImpl;

export class TableViewerStorageServiceDI extends Context.Service<TableViewerStorageServiceDI, TableViewerStorageServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/TableViewer/TableViewerStorageService#TableViewerStorageService',
) {
  static readonly implementation = TableViewerStorageServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TableViewerStorageServiceImpl, never, never> = Effect.sync(() => new TableViewerStorageServiceImpl());
  static readonly layer: Layer.Layer<TableViewerStorageServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TableViewerStorageService = TableViewerStorageServiceDI;
