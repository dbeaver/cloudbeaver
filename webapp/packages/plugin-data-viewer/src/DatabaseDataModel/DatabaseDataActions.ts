/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

type ActionsList<TOptions, TResult extends IDatabaseDataResult> = Array<IDatabaseDataAction<TOptions, TResult>>;

export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataActions<TOptions, TResult> {
  private actions: Map<string, ActionsList<TOptions, TResult>>;
  private source: IDatabaseDataSource<TOptions, TResult>;

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.actions = new Map();
    this.source = source;

    makeObservable<DatabaseDataActions<TOptions, TResult>, 'actions'>(this, {
      actions: observable.shallow,
    });
  }

  get <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    // if (Action.dataFormat !== result.dataFormat) {
    //   throw new Error('DataFormat unsupported');
    // }

    if (!this.actions.has(result.id)) {
      this.actions.set(result.id, observable.array(undefined, { deep: false }));
    }

    const actionsMap = this.actions.get(result.id)!;

    let action = actionsMap.find(action => action instanceof Action);

    if (!action) {
      action = new Action(this.source, result);
      actionsMap.push(action);
    }

    return action as T;
  }

  getImplementation <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined {
    if (!this.actions.has(result.id)) {
      this.actions.set(result.id, observable.array(undefined, { deep: false }));
    }

    const actionsMap = this.actions.get(result.id)!;

    const action = actionsMap.find(action => action instanceof Action);

    return action as T | undefined;
  }

  updateResults(results: TResult[]): void {
    const actionsMap = Array.from(this.actions.entries());

    for (const [key, actions] of actionsMap) {
      const result = results.find(result => result.id === key);

      if (!result) {
        for (const action of actions) {
          action.dispose();
        }
        this.actions.delete(key);
      } else {
        for (const action of actions) {
          action.updateResult(result);
        }
      }
    }
  }
}
