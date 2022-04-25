/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable, runInAction } from 'mobx';

import { getDependingDataActions } from './Actions/DatabaseDataActionDecorator';
import { isDatabaseDataAction } from './DatabaseDataAction';
import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource } from './IDatabaseDataSource';

type ActionsList<TOptions, TResult extends IDatabaseDataResult> = Array<IDatabaseDataAction<TOptions, TResult>>;

export class DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataActions<TOptions, TResult> {
  private readonly actions: Map<string, ActionsList<TOptions, TResult>>;
  private readonly source: IDatabaseDataSource<TOptions, TResult>;

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.actions = new Map();
    this.source = source;

    makeObservable<this, 'actions' | 'createActionsList'>(this, {
      actions: observable.shallow,
      updateResults: action,
      createActionsList: action,
    });
  }

  tryGet<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined {
    if (Action.dataFormat && !Action.dataFormat.includes(result.dataFormat)) {
      return undefined;
    }

    return this.get(result, Action);
  }

  get<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    if (Action.dataFormat && !Action.dataFormat.includes(result.dataFormat)) {
      throw new Error('DataFormat unsupported');
    }

    const actions = this.getOrCreateActionsList(result.uniqueResultId);

    return runInAction(() => {
      let action = actions.find(action => action instanceof Action);

      if (!action) {
        const allDeps = getDependingDataActions(Action)
          .slice(2); // skip source and result arguments

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

        action = new Action(this.source, result, ...depends);
        this.addActionToList(result.uniqueResultId, actions, action);
      }
      return action as T;
    });
  }

  getImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    Action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined {
    const actions = this.getActionsList(result.uniqueResultId);
    const action = actions?.find(action => action instanceof Action);

    return action as T | undefined;
  }

  updateResults(results: TResult[]): void {
    let actionsMap = Array.from(this.actions.entries());

    for (const [key, actions] of actionsMap) {
      const result = results.find(result => result.uniqueResultId === key);

      for (const action of actions) {
        action.updateResults(results);

        if (!result) {
          action.dispose();
        } else {
          action.updateResult(result);
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

  private addActionToList(
    resultId: string,
    actions: ActionsList<TOptions, TResult>,
    action: IDatabaseDataAction<TOptions, TResult>
  ) {
    actions.push(action);
  }

  private getOrCreateActionsList(resultId: string): ActionsList<TOptions, TResult> {
    let actions = this.getActionsList(resultId);

    if (!actions) {
      actions = this.createActionsList(resultId);
    }

    return actions;
  }

  private createActionsList(resultId: string): ActionsList<TOptions, TResult> {
    const actions: ActionsList<TOptions, TResult> = observable.array([], { deep: false });
    this.actions.set(resultId, actions);
    return actions;
  }

  private getActionsList(resultId: string): ActionsList<TOptions, TResult> | undefined {
    return this.actions.get(resultId);
  }
}
