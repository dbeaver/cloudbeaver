/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export interface IDatabaseDataActions<TOptions, TResult extends IDatabaseDataResult> {
  tryGet: <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ) => T | undefined;
  get: <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ) => T;
  getImplementation: <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ) => T | undefined;

  updateResults: (results: TResult[]) => void;
}
