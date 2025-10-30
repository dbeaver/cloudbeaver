/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import { createService } from '@cloudbeaver/core-di';

export interface IDatabaseDataViewAction<TKey = unknown, TValue = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  has(cell: TKey): boolean;
  get: (key: TKey) => TValue | undefined;
}

export const IDatabaseDataViewAction = createService<IDatabaseDataViewAction>('IDatabaseDataViewAction');
