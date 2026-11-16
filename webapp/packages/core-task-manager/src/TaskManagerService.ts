/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { uuid } from '@cloudbeaver/core-utils';

import type { ITaskDescriptor, ITaskDescriptorOptions } from './ITaskDescriptor.js';

export class TaskManagerServiceImpl {
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

export type TaskManagerService = TaskManagerServiceImpl;

export class TaskManagerServiceDI extends Context.Service<TaskManagerServiceDI, TaskManagerServiceImpl>()(
  '@cloudbeaver/core-task-manager/TaskManagerService#TaskManagerService',
) {
  static readonly implementation = TaskManagerServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TaskManagerServiceImpl, never, never> = Effect.sync(() => new TaskManagerServiceImpl());
  static readonly layer: Layer.Layer<TaskManagerServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TaskManagerService = TaskManagerServiceDI;
