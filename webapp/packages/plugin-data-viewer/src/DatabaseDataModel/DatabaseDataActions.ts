/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction } from 'mobx';

import { MetadataMap } from '@cloudbeaver/core-utils';

import { getDependingDataActions } from './Actions/DatabaseDataActionDecorator';
import { isDatabaseDataAction } from './DatabaseDataAction';
import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

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
    if (Action.dataFormat && !Action.dataFormat.includes(result.dataFormat)) {
      throw new Error('DataFormat unsupported');
    }

    const actions = this.actions.get(result.uniqueResultId);

    let action = actions.find(action => action instanceof Action);

    if (!action) {
      runInAction(() => {
        const allDeps = getDependingDataActions(Action).slice(1); // skip source argument

        const depends: any[] = [];

        for (const dependency of allDeps) {
          if (isDatabaseDataAction(dependency)) {
            depends.push(this.get<IDatabaseDataAction<TOptions, TResult>>(result, dependency));
          } else {
            depends.push(this.source.serviceInjector.getServiceByClass(dependency as any));
          }
        }

        if (allDeps.length !== depends.length) {
          throw new Error('Unsupported inject in: ' + Action.name);
        }

        action = new Action(this.source, ...depends);
        action.updateResult(result, this.source.results.indexOf(result));
        this.actions.set(result.uniqueResultId, [...actions, action]);
      });
    }

    return action as T;
  }

  getImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ): T | undefined {
    const actions = this.actions.get(result.uniqueResultId);
    const action = actions?.find(action => action instanceof Action);

    return action as T | undefined;
  }

  updateResults(results: TResult[]): void {
    let actionsMap = Array.from(this.actions.entries());

    for (const [key, actions] of actionsMap) {
      const result = results.find(result => result.uniqueResultId === key);

      for (const action of actions) {
        if (!(action.constructor as any).dataFormat.includes(result?.dataFormat)) {
          this.actions.delete(key);
          continue;
        }

        action.updateResults(results);

        if (!result) {
          action.dispose();
        } else {
          action.updateResult(result, results.indexOf(result));
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
