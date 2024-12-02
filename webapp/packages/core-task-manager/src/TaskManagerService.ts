/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { uuid } from '@cloudbeaver/core-utils';

import type { ITaskDescriptor, ITaskDescriptorOptions } from './ITaskDescriptor.js';

@injectable()
export class TaskManagerService {
  get pendingTasks(): ITaskDescriptor[] {
    return this.queue.filter(task => !task.fulfilled);
  }

  readonly onDataUpdate: ISyncExecutor;
  private readonly queue: ITaskDescriptor[];

  constructor() {
    this.queue = [];
    this.onDataUpdate = new SyncExecutor();

    makeObservable<this, 'queue'>(this, {
      queue: observable,
    });
  }

  register(task: ITaskDescriptorOptions): void {
    const taskDescriptor = observable<ITaskDescriptor>(
      {
        id: uuid(),
        fulfilled: false,
        exception: undefined,
        ...task,
      },
      {
        fulfilled: observable.ref,
        exception: observable.ref,
      },
    );

    taskDescriptor.task
      .finally(() => {
        taskDescriptor.fulfilled = true;
      })
      .catch(error => {
        taskDescriptor.exception = error;
      })
      .then(() => {
        this.remove(taskDescriptor);
      });

    this.add(taskDescriptor);
  }

  private add(task: ITaskDescriptor): void {
    this.queue.push(task);
    this.onDataUpdate.execute();
  }

  private remove(task: ITaskDescriptor): void {
    const index = this.queue.indexOf(task);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.onDataUpdate.execute();
    }
  }
}
