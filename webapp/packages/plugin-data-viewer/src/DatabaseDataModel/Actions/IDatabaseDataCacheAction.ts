/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createService } from '@cloudbeaver/core-di';
import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export interface IDatabaseDataCacheAction<TKey = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  has(key: TKey, scope: symbol): boolean;
  get<T>(key: TKey, scope: symbol): T | undefined;
  set<T>(key: TKey, scope: symbol, value: T): void;
  delete(key: TKey, scope: symbol): void;
  deleteAll(scope: symbol): void;
}

export const IDatabaseDataCacheAction = createService<IDatabaseDataCacheAction>('IDatabaseDataCacheAction');
