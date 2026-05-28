/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, untracked } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction.js';
import type { IDatabaseDataActions } from './IDatabaseDataActions.js';
import { IDatabaseDataResult } from './IDatabaseDataResult.js';
import { IDatabaseDataSource } from './IDatabaseDataSource.js';
import { Disposable, injectable, IServiceProvider, withExternal, type IServiceScope, type SingleServiceType } from '@cloudbeaver/core-di';

@injectable(() => [IDatabaseDataSource, IServiceProvider])
export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult>
  extends Disposable
  implements IDatabaseDataActions<TOptions, TResult>
{
  readonly registeredActions: Map<SingleServiceType<unknown>, SingleServiceType<unknown>[]>;
  private resultScopes: Map<string, IServiceScope>;

  constructor(
    private readonly source: IDatabaseDataSource<TOptions, TResult>,
    private readonly serviceProvider: IServiceProvider,
  ) {
    super();
    this.registeredActions = new Map();
    this.resultScopes = new Map();

    makeObservable<this, 'resultScopes'>(this, {
      updateResults: action,
      resultScopes: observable.shallow,
    });
  }

  registerAction<T>(service: SingleServiceType<any>, implementation: SingleServiceType<T>): this {
    let implementations = this.registeredActions.get(service);
    if (!implementations) {
      implementations = [];
      this.registeredActions.set(service, implementations);
    }
    if (!implementations.includes(implementation)) {
      implementations.push(implementation);
    }
    return this;
  }
  unregisterAction<T>(service: SingleServiceType<any>, implementation: SingleServiceType<T>): this {
    const implementations = this.registeredActions.get(service);
    if (implementations) {
      const index = implementations.indexOf(implementation);
      if (index !== -1) {
        implementations.splice(index, 1);
      }
    }
    return this;
  }

  getConstructor<T extends IDatabaseDataAction<TOptions, TResult>>(service: SingleServiceType<T>): SingleServiceType<T> {
    const possibleImplementations = this.registeredActions
      .get(service)
      ?.filter(action => isActionSupportsFormat(action as any, this.source.dataFormat));
    const impl = possibleImplementations?.[possibleImplementations.length - 1];
    if (!impl) {
      throw new Error(`Action ${service.name} not found for format ${this.source.dataFormat}`);
    }
    return impl as SingleServiceType<T>;
  }

  tryGet<T>(result: TResult, Action: SingleServiceType<T, any[]>): T | undefined;
  tryGet<T>(result: TResult, Action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T | undefined;
  tryGet<T>(result: TResult, Action: SingleServiceType<T, any[]>, implementation?: SingleServiceType<unknown>): T | undefined {
    try {
      return this.get(result, Action, implementation!) as T;
    } catch {
      return undefined;
    }
  }

  get<T>(result: TResult, Action: SingleServiceType<T, any[]>): T;
  get<T>(result: TResult, Action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T;
  get<T>(result: TResult, Action: SingleServiceType<T, any[]>, implementation?: SingleServiceType<unknown>): T {
    const scope = this.resultScopes.get(result.uniqueResultId);
    if (!scope) {
      throw new Error(`Result ${result.uniqueResultId} not found in the source`);
    }
    const value = untracked(() =>
      scope.serviceProvider.getService(
        withExternal(Action)
          .set(IDatabaseDataResult, result)
          .set(IDatabaseDataSource, this.source as unknown),
      ),
    );

    if (implementation && !(value instanceof implementation)) {
      throw new Error(`Action ${Action.name} not found for format ${this.source.dataFormat}`);
    }

    return value;
  }

  updateResults(results: TResult[]): this {
    const scopes = Array.from(this.resultScopes.entries()).filter(([key]) => !results.find(result => result.uniqueResultId === key));

    for (const [key, scope] of scopes) {
      scope[Symbol.dispose]?.();
      this.resultScopes.delete(key);
    }

    for (const result of results) {
      if (!this.resultScopes.has(result.uniqueResultId)) {
        this.resultScopes.set(result.uniqueResultId, this.serviceProvider.createScope());
      }
    }
    return this;
  }

  protected override dispose(): Promise<void> | void {
    for (const scope of this.resultScopes.values()) {
      scope[Symbol.dispose]?.();
    }
    this.resultScopes.clear();
  }
}

function isActionSupportsFormat<TOptions, TResult extends IDatabaseDataResult>(
  action: IDatabaseDataActionClass<TOptions, TResult, IDatabaseDataAction<TOptions, TResult>> | IDatabaseDataAction<TOptions, TResult>,
  format: ResultDataFormat,
): boolean {
  if ('dataFormat' in action) {
    return !action.dataFormat || action.dataFormat.includes(format);
  }
  const constructor = action.constructor as IDatabaseDataActionClass<TOptions, TResult, IDatabaseDataAction<TOptions, TResult>>;
  return !constructor.dataFormat || constructor.dataFormat.includes(format);
}
