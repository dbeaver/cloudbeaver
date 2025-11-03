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
import type { IDatabaseValueHolder } from './IDatabaseValueHolder.js';

export interface IDatabaseDataFormatAction<TKey = unknown, TValue = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  isReadOnly: (key: TKey) => boolean;
  isNull: (holder: IDatabaseValueHolder<TKey, TValue>) => boolean;
  isBinary: (holder: IDatabaseValueHolder<TKey, TValue>) => boolean;
  isGeometry(holder: IDatabaseValueHolder<TKey, TValue>): boolean;
  isText(holder: IDatabaseValueHolder<TKey, TValue>): boolean;
  isNumber(holder: IDatabaseValueHolder<TKey, TValue>): boolean;
  get: (key: TKey) => IDatabaseValueHolder<TKey, TValue>;
  getText: (holder: IDatabaseValueHolder<TKey, TValue>) => string;
  getNumber: (holder: IDatabaseValueHolder<TKey, TValue>) => number;
  getDisplayString: (holder: IDatabaseValueHolder<TKey, TValue>) => string;
}

export const IDatabaseDataFormatAction = createService<IDatabaseDataFormatAction<any, any, any>>('IDatabaseDataFormatAction');
