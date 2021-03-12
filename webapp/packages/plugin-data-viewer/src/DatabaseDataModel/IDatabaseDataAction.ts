/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult';

export interface IDatabaseDataActionClass<
  TResult extends IDatabaseDataResult,
  TAction extends IDatabaseDataAction<TResult>
> {
  new (result: TResult): TAction;
  dataFormat: ResultDataFormat;
}

export interface IDatabaseDataAction<TResult extends IDatabaseDataResult> {
  readonly result: TResult;
  updateResult: (result: TResult) => void;
}
