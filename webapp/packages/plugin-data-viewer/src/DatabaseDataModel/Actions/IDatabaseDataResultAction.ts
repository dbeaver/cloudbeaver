/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export interface IDatabaseDataResultAction<TKey, TResult extends IDatabaseDataResult> extends IDatabaseDataAction<any, TResult> {
  readonly empty: boolean;
  getIdentifier(key: TKey): string;
  serialize(key: TKey): string;
}
