/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

export interface IDatabaseDataActionClass<
  TOptions,
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TOptions, TResult>
> {
  new (source: IDatabaseDataSource<TOptions, TResult>, result: TResult): TAction;
  dataFormat: ResultDataFormat;
}

export interface IDatabaseDataAction<TOptions, TResult extends IDatabaseDataResult> {
  readonly source: IDatabaseDataSource<TOptions, TResult>;
  result: TResult;
  resultIndex: number;
  updateResult: (result: TResult) => void;
  getAction: <T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ) => T;
  dispose: () => void;
}
