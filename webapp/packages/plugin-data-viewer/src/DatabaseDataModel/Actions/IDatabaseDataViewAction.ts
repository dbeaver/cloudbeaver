/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context } from '@cloudbeaver/core-di';
import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import type { IDatabaseValueHolder } from './IDatabaseValueHolder.js';

export interface IDatabaseDataViewAction<
  TKey = unknown,
  TValue = unknown,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends IDatabaseDataAction<any, TResult> {
  has(cell: TKey): boolean;
  get: (key: TKey) => IDatabaseValueHolder<TKey, TValue> | undefined;
}

export const IDatabaseDataViewAction = Context.Service<IDatabaseDataViewAction>(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/IDatabaseDataViewAction#IDatabaseDataViewAction',
);
