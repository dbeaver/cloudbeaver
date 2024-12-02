/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import { type IDatabaseDataSource } from './DatabaseDataModel/IDatabaseDataSource.js';

export interface IDataViewerTableStorage {
  has(tableId: string): boolean;
  get<T extends IDatabaseDataModel<any> = IDatabaseDataModel>(tableId: string): T | undefined;
  add<TSource extends IDatabaseDataSource<any, any> = IDatabaseDataSource>(model: IDatabaseDataModel<TSource>): IDatabaseDataModel<TSource>;
  remove(tableId: string): void;
}
