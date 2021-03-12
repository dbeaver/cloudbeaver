/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export interface IDatabaseDataActions<TResult extends IDatabaseDataResult> {
  get: <T extends IDatabaseDataAction<TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TResult, T>
  ) => T;

  updateResults: (results: TResult[]) => void;
}
