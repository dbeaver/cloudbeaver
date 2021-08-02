/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

export abstract class DatabaseDataAction<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataAction<TOptions, TResult> {
  result: TResult;

  get resultIndex(): number {
    return this.source.results.indexOf(this.result);
  }

  readonly source: IDatabaseDataSource<TOptions, TResult>;

  constructor(source: IDatabaseDataSource<TOptions, TResult>, result: TResult) {
    this.result = result;
    this.source = source;
  }

  updateResult(result: TResult): void {
    this.result = result;
  }

  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    return this.source.actions.get(this.result, action);
  }

  dispose(): void {}
}
