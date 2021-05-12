/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

type ActionsMap<TOptions, TResult extends IDatabaseDataResult> = Map<
IDatabaseDataActionClass<TOptions, TResult, IDatabaseDataAction<TOptions, TResult>>,
IDatabaseDataAction<TOptions, TResult>
>;

export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataActions<TOptions, TResult> {
  private actions: Map<string, ActionsMap<TOptions, TResult>>;
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
    if (!this.actions.has(result.id)) {
      this.actions.set(result.id, observable.map(undefined, { deep: false }));
    }

    const actionsMap = this.actions.get(result.id)!;

    if (!actionsMap.has(Action)) {
      actionsMap.set(Action, new Action(this.source, result));
    }

    return actionsMap.get(Action)! as T;
  }

  updateResults(results: TResult[]): void {
    const keys = Array.from(this.actions.keys());

    for (const key of keys) {
      if (!results.some(result => result.id === key)) {
        this.actions.delete(key);
      }
    }
  }
}
