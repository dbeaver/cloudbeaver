/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export interface IDatabaseDataFormatAction<TKey, TResult extends IDatabaseDataResult> extends IDatabaseDataAction<any, TResult> {
  isReadOnly: (key: TKey) => boolean;
  isNull: (key: TKey) => boolean;
  isBinary: (key: TKey) => boolean;
  get: (key: TKey) => any;
  getText: (key: TKey) => string;
  getDisplayString: (key: TKey) => string;
}
