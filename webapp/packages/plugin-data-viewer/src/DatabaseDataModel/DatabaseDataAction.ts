/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction.js';
import type { IDatabaseDataResult } from './IDatabaseDataResult.js';
import type { IDatabaseDataSource } from './IDatabaseDataSource.js';
import { Disposable } from '@cloudbeaver/core-di';

export abstract class DatabaseDataAction<TOptions, TResult extends IDatabaseDataResult>
  extends Disposable
  implements IDatabaseDataAction<TOptions, TResult>
{
  resultIndex: number;

  readonly source: IDatabaseDataSource<TOptions, TResult>;

  constructor(
    source: IDatabaseDataSource<TOptions, TResult>,
    public result: TResult,
  ) {
    super();
    this.source = source;
    this.resultIndex = source.results.indexOf(result);

    this.updateResult = this.updateResult.bind(this);
    this.updateResults = this.updateResults.bind(this);
    this.afterResultUpdate = this.afterResultUpdate.bind(this);

    source.onResultsUpdate.addHandler(this.updateResults).addPostHandler(this.afterResultUpdate);

    makeObservable(this, {
      result: observable.ref,
      resultIndex: observable.ref,
    });
  }

  updateResult(result: TResult, index: number): void {
    this.result = result;
    this.resultIndex = index;
  }

  updateResults(results: TResult[]): void {
    const currentResult = results.find(r => r.uniqueResultId === this.result?.uniqueResultId);
    if (currentResult) {
      this.updateResult(currentResult, results.indexOf(currentResult));
    }
  }

  afterResultUpdate(): void {}

  override dispose(): void {
    this.source.onResultsUpdate.removeHandler(this.updateResults);
    this.source.onResultsUpdate.removePostHandler(this.afterResultUpdate);
  }
}

export function isDatabaseDataAction(action: any): action is IDatabaseDataActionClass<any, any, any> {
  return action.prototype instanceof DatabaseDataAction;
}
