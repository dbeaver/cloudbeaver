/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabasePersistedStateAction } from '../IDatabasePersistedStateAction.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult])
export class DatabasePersistedStateAction<TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabasePersistedStateAction<TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;

  private store: Record<string, unknown> = {};

  setStore(store: Record<string, unknown>): void {
    this.store = store;
  }

  has(key: string): boolean {
    return key in this.store;
  }

  get<T>(key: string): T | undefined {
    return this.store[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }
}
