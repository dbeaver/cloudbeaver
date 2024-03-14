/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { IDatabaseDataResultAction } from './IDatabaseDataResultAction';

@databaseDataAction()
export abstract class DatabaseDataResultAction<TKey, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataResultAction<TKey, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;

  constructor(source: IDatabaseDataSource<any, TResult>) {
    super(source);
  }
  abstract getIdentifier(key: TKey): string;
  abstract serialize(key: TKey): string;
}
