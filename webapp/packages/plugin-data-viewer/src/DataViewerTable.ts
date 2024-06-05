/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Connection } from '@cloudbeaver/core-connections';

import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';
import type { IDataViewerTableStorage } from './IDataViewerTableStorage';

export abstract class DataViewerTable {
  storage: IDataViewerTableStorage;

  constructor(storage: IDataViewerTableStorage) {
    this.storage = storage;
  }

  has(tableId: string): boolean {
    return this.storage.has(tableId);
  }

  get(tableId: string): IDatabaseDataModel<any, any> | undefined {
    return this.storage.get(tableId);
  }

  async removeTableModel(tableId: string): Promise<void> {
    const model = this.storage.get(tableId);

    if (model) {
      this.storage.remove(tableId);
      await model.dispose();
    }
  }

  abstract create(connection: Connection, ...args: any[]): IDatabaseDataModel<any, IDatabaseResultSet>;
}
