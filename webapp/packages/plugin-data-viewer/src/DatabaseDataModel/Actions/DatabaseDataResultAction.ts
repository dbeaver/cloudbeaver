/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import type { IDatabaseDataSource } from '../IDatabaseDataSource.js';
import type { IDatabaseDataResultAction } from './IDatabaseDataResultAction.js';

export abstract class DatabaseDataResultAction<TKey, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataResultAction<TKey, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;

  get empty(): boolean {
    return !this.result.data;
  }

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
  }
  abstract getIdentifier(key: TKey): string;
  abstract serialize(key: TKey): string;
}
