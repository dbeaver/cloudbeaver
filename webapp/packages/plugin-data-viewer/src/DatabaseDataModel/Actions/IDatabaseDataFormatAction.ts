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

export interface IDatabaseDataFormatAction<TKey = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  isReadOnly: (key: TKey) => boolean;
  isNull: (key: TKey) => boolean;
  isBinary: (key: TKey) => boolean;
  isGeometry(key: TKey): boolean;
  isText(key: TKey): boolean;
  get: (key: TKey) => any;
  getText: (key: TKey) => string;
  getDisplayString: (key: TKey) => string;
}

export const IDatabaseDataFormatAction = createService<IDatabaseDataFormatAction<any, any>>('IDatabaseDataFormatAction');
