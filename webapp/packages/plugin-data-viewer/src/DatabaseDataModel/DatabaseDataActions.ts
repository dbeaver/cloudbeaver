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

type ActionsMap<TResult extends IDatabaseDataResult> = Map<
IDatabaseDataActionClass<TResult, IDatabaseDataAction<TResult>>,
IDatabaseDataAction<TResult>
>;

export class DatabaseDataActions<TResult extends IDatabaseDataResult> implements IDatabaseDataActions<TResult> {
  private actions: Map<string, ActionsMap<TResult>>;

  constructor() {
    this.actions = new Map();

    makeObservable<DatabaseDataActions<TResult>, 'actions'>(this, {
      actions: observable.shallow,
    });
  }

  get <T extends IDatabaseDataAction<TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TResult, T>
  ): T {
    if (!this.actions.has(result.id)) {
      this.actions.set(result.id, observable.map(undefined, { deep: false }));
    }

    const actionsMap = this.actions.get(result.id)!;

    if (!actionsMap.has(Action)) {
      actionsMap.set(Action, new Action(result));
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
