/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ConnectionExecutionContextResource, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { ITask, TaskScheduler } from '@cloudbeaver/core-executor';

import type { ITransactionExecutionContext } from './ITransactionExecutionContext';

export class TransactionExecutionContext implements ITransactionExecutionContext {
  get context(): IConnectionExecutionContextInfo | undefined {
    return this.connectionExecutionContextResource.get(this.contextId);
  }

  get executing(): boolean {
    return this.scheduler.isExecuting(this.contextId);
  }

  get cancellable(): boolean {
    return this.currentTask?.cancellable || false;
  }

  private currentTask: ITask<any> | null;

  constructor(
    private readonly scheduler: TaskScheduler<string>,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly contextId: string,
  ) {
    this.currentTask = null;
    makeObservable<this, 'currentTask'>(this, {
      currentTask: observable.ref,
      context: computed,
      executing: computed,
      cancellable: computed,
    });
  }

  run<T>(task: () => Promise<T>, cancel?: () => Promise<any> | void, end?: () => Promise<any> | void): ITask<T> {
    if (!this.context) {
      throw new Error('Execution Context not found');
    }

    this.currentTask = this.scheduler
      .schedule(this.contextId, task, { cancel })
      .finally(end)
      .finally(() => {
        this.currentTask = null;
      });

    return this.currentTask;
  }

  async cancel(): Promise<void> {
    await this.scheduler.cancel(this.contextId);
  }

  async destroy(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.cancel();
  }
}
