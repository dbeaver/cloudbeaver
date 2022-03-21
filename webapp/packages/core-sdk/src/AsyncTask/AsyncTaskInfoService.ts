/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { cancellableTimeout } from '@cloudbeaver/core-utils';

import { GraphQLService } from '../GraphQLService';
import type { AsyncTaskInfo } from '../sdk';
import { AsyncTask } from './AsyncTask';

const DELAY_BETWEEN_TRIES = 1000;

@injectable()
export class AsyncTaskInfoService {
  private tasks: Map<string, AsyncTask>;

  constructor(
    private graphQLService: GraphQLService,
  ) {
    this.tasks = new Map();
  }

  create(getter: () => Promise<AsyncTaskInfo>): AsyncTask {
    const task = new AsyncTask(getter, this.cancelTask.bind(this));
    this.tasks.set(task.id, task);

    if (this.tasks.size === 1) {
      setTimeout(() => this.update(), 1);
    }

    return task;
  }

  async run(task: AsyncTask): Promise<AsyncTaskInfo> {
    if (task.info === null) {
      await task.run();
    }

    return task.promise;
  }

  async remove(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    if (task.pending) {
      throw new Error('Cant remove unfinished task');
    }

    this.tasks.delete(taskId);

    if (task.info !== null) {
      await this.graphQLService.sdk.getAsyncTaskInfo({
        taskId: task.info.id,
        removeOnFinish: true,
      });
    }
  }

  async cancel(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    await task?.cancelAsync();
  }

  private async update() {
    while (this.tasks.size > 0) {
      const tasks = Array.from(this.tasks.values());

      for (const task of tasks) {
        this.updateTask(task);
      }

      await cancellableTimeout(DELAY_BETWEEN_TRIES);
    }
  }

  private async updateTask(task: AsyncTask): Promise<void> {
    try {
      if (task.pending && task.info) {
        await task.updateInfoAsync(async task => {
          const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({
            taskId: task.info!.id,
            removeOnFinish: false,
          });

          return taskInfo;
        });
      }
    } catch (e: any) {
      console.log('Failed to check async task status', e);
    }
  }

  private async cancelTask(info: AsyncTaskInfo): Promise<void> {
    await this.graphQLService.sdk.asyncTaskCancel({
      taskId: info.id,
    });
  }
}
