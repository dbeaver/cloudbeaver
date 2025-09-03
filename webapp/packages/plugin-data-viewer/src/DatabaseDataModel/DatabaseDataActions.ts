/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { getDependingDataActions } from './Actions/DatabaseDataActionDecorator.js';
import { isDatabaseDataAction } from './DatabaseDataAction.js';
import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction.js';
import type { IDatabaseDataActions } from './IDatabaseDataActions.js';
import type { IDatabaseDataResult } from './IDatabaseDataResult.js';
import type { IDatabaseDataSource } from './IDatabaseDataSource.js';

type ActionsList<TOptions, TResult extends IDatabaseDataResult> = Array<IDatabaseDataAction<TOptions, TResult>>;

export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult> implements IDatabaseDataActions<TOptions, TResult> {
  private readonly actions: MetadataMap<string, ActionsList<TOptions, TResult>>;
  private readonly source: IDatabaseDataSource<TOptions, TResult>;

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.actions = new MetadataMap(() => []);
    this.source = source;

    makeObservable<this>(this, {
      updateResults: action,
    });
  }

  tryGet<T extends IDatabaseDataAction<TOptions, TResult>>(result: TResult, Action: IDatabaseDataActionClass<TOptions, TResult, T>): T | undefined {
    if (Action.dataFormat && !Action.dataFormat.includes(result.dataFormat)) {
      return undefined;
    }

    return this.get(result, Action);
  }

  get<T extends IDatabaseDataAction<TOptions, TResult>>(result: TResult, Action: IDatabaseDataActionClass<TOptions, TResult, T>): T {
    if (!isActionSupportsFormat(Action, result.dataFormat)) {
      throw new Error('DataFormat unsupported');
    }

    const actions = this.actions.get(result.uniqueResultId);

    let action = actions.find(action => action instanceof Action && isActionSupportsFormat(action, result.dataFormat));

    if (!action) {
      runInAction(() => {
        const allDeps = getDependingDataActions(Action).slice(1); // skip source argument
        const resultIndexMap = new Map<string, number>(this.source.results.map((r, i) => [r.uniqueResultId, i]));

        const depends: any[] = [];

        for (const dependency of allDeps) {
          if (isDatabaseDataAction(dependency)) {
            depends.push(this.get(result, dependency));
          } else {
            depends.push(this.source.serviceProvider.getService(dependency as any));
          }
        }

        if (allDeps.length !== depends.length) {
          throw new Error('Unsupported inject in: ' + Action.name);
        }

        action = new Action(this.source, ...depends);
        action.updateResult(result, resultIndexMap.get(result.uniqueResultId) ?? -1);
        action.afterResultUpdate();
        this.actions.set(result.uniqueResultId, [...this.actions.get(result.uniqueResultId), action]);
      });
    }

    return action as T;
  }

  getImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ): T | undefined {
    const actions = this.actions.get(result.uniqueResultId);
    const action = actions?.find(action => action instanceof Action && isActionSupportsFormat(action, result.dataFormat));

    return action as T | undefined;
  }

  updateResults(results: TResult[]): void {
    let actionsMap = Array.from(this.actions.entries());
    const resultMap = new Map<string, TResult>(results.map(result => [result.uniqueResultId, result]));
    const resultIndexMap = new Map<string, number>(results.map((result, i) => [result.uniqueResultId, i]));

    for (const [key, actions] of actionsMap) {
      const result = resultMap.get(key);
      const resultIndex = resultIndexMap.get(key) ?? -1;

      for (const action of actions) {
        action.updateResults(results);

        if (!result) {
          action.dispose();
        } else {
          action.updateResult(result, resultIndex);
        }
      }

      if (!result) {
        this.actions.delete(key);
      }
    }

    actionsMap = Array.from(this.actions.entries());

    for (const [, actions] of actionsMap) {
      for (const action of actions) {
        action.afterResultUpdate();
      }
    }
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
