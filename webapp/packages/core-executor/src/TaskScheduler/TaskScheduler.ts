/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, makeObservable } from 'mobx';

import type { ITask } from './ITask';
import { Task } from './Task';

interface ITaskContainer<T, TValue> {
  readonly id: T;
  task: ITask<TValue>;
}

export type BlockedExecution<T> = (active: T, current: T) => boolean;
export interface IScheduleOptions {
  cancel?: () => Promise<any> | any;
  before?: () => any;
  after?: () => Promise<any> | any;
  success?: () => Promise<any> | any;
  error?: (exception: Error) => Promise<any> | any;
}

const queueLimit = 100;

export class TaskScheduler<TIdentifier> {
  get activeList(): TIdentifier[] {
    return this.queue.map(task => task.id);
  }

  get executing(): boolean {
    return this.queue.length > 0;
  }

  private readonly queue: Array<ITaskContainer<TIdentifier, any>>;

  private readonly isBlocked: BlockedExecution<TIdentifier> | null;

  constructor(isBlocked: BlockedExecution<TIdentifier> | null = null) {
    makeObservable<TaskScheduler<TIdentifier>, 'queue'>(this, {
      activeList: computed,
      queue: observable.shallow,
    });

    this.queue = [];
    this.isBlocked = isBlocked;
  }

  isExecuting(id: TIdentifier): boolean {
    if (!this.isBlocked) {
      return this.executing;
    }
    return this.queue.some(active => this.isBlocked!(active.id, id));
  }

  async waitRelease(id: TIdentifier): Promise<void> {
    const promise = this.queue
      .slice()
      .reverse()
      .find(active => this.isBlocked!(active.id, id));

    if (promise) {
      try {
        await promise.task;
      } catch {}
    }
  }

  schedule<T>(
    id: TIdentifier,
    promise: () => Promise<T>,
    options?: IScheduleOptions,
  ): ITask<T> {
    if (this.queue.length > queueLimit) {
      throw new Error('Execution queue limit is reached');
    }

    const task = new Task<T>(promise, options?.cancel);
    const container: ITaskContainer<TIdentifier, T> = { id, task };
    this.queue.push(container);
    options?.before?.();

    this.execute(container);

    return task
      .then(async value => {
        await options?.success?.();
        return value;
      })
      .catch(async exception => {
        await options?.error?.(exception);
        throw exception;
      })
      .finally(() => options?.after?.())
      .finally(() => this.queue.splice(this.queue.indexOf(container), 1));
  }

  async cancel(id: TIdentifier): Promise<void> {
    const containers = this.queue.filter(container => container.id === id && !container.task.cancelled);

    for (const container of containers) {
      await container.task.cancel();
    }
  }

  async wait(): Promise<void> {
    const queueList = this.queue.slice();

    for (const container of queueList) {
      try {
        await container.task;
      } catch {}
    }
  }

  private async execute<T>(container: ITaskContainer<TIdentifier, T>) {
    if (this.isBlocked) {
      const queueList = this.queue.filter(
        active =>
          active !== container
            && this.isBlocked!(active.id, container.id)
      );

      for (const _container of queueList) {
        if (container.task.cancelled) {
          throw new Error('Task was cancelled');
        }
        if (!_container.task.cancelled) {
          try {
            await _container.task;
          } catch {}
        }
      }
    }

    container.task.run();
  }
}
