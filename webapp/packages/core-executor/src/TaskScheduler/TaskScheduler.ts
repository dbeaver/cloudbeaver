/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { ITask } from './ITask';

export type BlockedExecution<T> = (active: T, current: T) => boolean;

export class TaskScheduler<TIdentifier> {
  @computed get activeList(): TIdentifier[] {
    return this.queue.map(task => task.id);
  }

  @observable.shallow
  private readonly queue: Array<ITask<TIdentifier>>;

  private readonly isBlocked: BlockedExecution<TIdentifier> | null;

  constructor(isBlocked: BlockedExecution<TIdentifier> | null = null) {
    this.queue = [];
    this.isBlocked = isBlocked;
  }

  async schedule<T>(
    id: TIdentifier,
    promise: () => Promise<T>,
    after?: () => Promise<void> | void,
  ): Promise<T> {
    const task: ITask<TIdentifier> = {
      id,
      task: this.scheduler(id, promise),
    };

    this.queue.push(task);

    try {
      return await task.task;
    } finally {
      this.queue.splice(this.queue.indexOf(task), 1);
      await after?.();
    }
  }

  private async scheduler<T>(id: TIdentifier, promise: () => Promise<T>) {
    if (!this.isBlocked) {
      return promise();
    }

    const queueList = this.queue.filter(active => this.isBlocked!(active.id, id));

    for (const task of queueList) {
      try {
        await task.task;
      } catch {}
    }

    return promise();
  }
}
