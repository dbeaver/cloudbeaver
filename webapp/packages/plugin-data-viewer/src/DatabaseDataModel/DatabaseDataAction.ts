/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
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

    makeObservable(this, {
      result: observable.ref,
    });
  }

  updateResult(result: TResult): void {
    this.result = result;
  }

  updateResults(results: TResult[]): void { }

  afterResultUpdate(): void { }

  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined {
    return this.source.actions.tryGet(this.result, action);
  }

  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    return this.source.actions.get(this.result, action);
  }

  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined {
    return this.source.actions.getImplementation(this.result, action);
  }

  dispose(): void { }
}

export function isDatabaseDataAction(action: any): action is IDatabaseDataActionClass<any, any, any> {
  return action.prototype instanceof DatabaseDataAction;
}
