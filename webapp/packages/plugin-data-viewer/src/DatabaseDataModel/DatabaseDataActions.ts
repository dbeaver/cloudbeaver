/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

type ActionsList<TOptions, TResult extends IDatabaseDataResult> = Array<IDatabaseDataAction<TOptions, TResult>>;

export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataActions<TOptions, TResult> {
  private actions: Map<string, ActionsList<TOptions, TResult>>;
  private source: IDatabaseDataSource<TOptions, TResult>;
  private unCommittedActions: Map<string, ActionsList<TOptions, TResult>>;

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.actions = new Map();
    this.unCommittedActions = new Map();
    this.source = source;

    makeObservable<DatabaseDataActions<TOptions, TResult>, 'actions'>(this, {
      actions: observable.shallow,
      updateResults: action,
    });
  }

  tryGet <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined {
    if (Action.dataFormat !== result.dataFormat) {
      return undefined;
    }

    return this.get(result, Action);
  }

  get <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    if (Action.dataFormat !== result.dataFormat) {
      throw new Error('DataFormat unsupported');
    }

    const actions = this.getOrCreateActionsList(result.id);
    let action = actions.find(action => action instanceof Action);

    if (!action) {
      action = new Action(this.source, result);
      this.addActionToList(result.id, actions, action);
    }

    return action as T;
  }

  getImplementation <T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined {
    const actions = this.getOrCreateActionsList(result.id);
    const action = actions.find(action => action instanceof Action);

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

  private addActionToList(
    resultId: string,
    actions: ActionsList<TOptions, TResult>,
    action: IDatabaseDataAction<TOptions, TResult>
  ) {
    actions = observable.array([...actions, action]);

    this.unCommittedActions.set(resultId, actions);
    this.scheduleCommit(resultId);
  }

  private getOrCreateActionsList(resultId: string): ActionsList<TOptions, TResult> {
    let actions = this.getActionsList(resultId);

    if (!actions) {
      actions = this.createActionsList(resultId);
    }

    return actions;
  }

  private createActionsList(resultId: string): ActionsList<TOptions, TResult> {
    const actions: ActionsList<TOptions, TResult> = observable.array(undefined, { deep: false });

    this.unCommittedActions.set(resultId, actions);
    this.scheduleCommit(resultId);

    return actions;
  }

  private getActionsList(resultId: string): ActionsList<TOptions, TResult> | undefined {
    const committed = this.actions.get(resultId);
    const unCommitted = this.unCommittedActions.get(resultId);
    return unCommitted ?? committed;
  }

  private scheduleCommit(resultId: string) {
    setTimeout(() => {
      const actions = this.unCommittedActions.get(resultId);

      if (actions) {
        this.actions.set(resultId, actions);
        this.unCommittedActions.delete(resultId);
      }
    }, 1);
  }
}
