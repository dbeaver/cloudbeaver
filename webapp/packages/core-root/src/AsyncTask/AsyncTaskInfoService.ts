/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Subscription } from 'rxjs';

import { Disposable, injectable } from '@cloudbeaver/core-di';
import { type AsyncTaskInfo, GraphQLService, type WsAsyncTaskInfo } from '@cloudbeaver/core-sdk';

import { ServerEventId } from '../SessionEventSource.js';
import { AsyncTask } from './AsyncTask.js';
import { AsyncTaskInfoEventHandler } from './AsyncTaskInfoEventHandler.js';

@injectable()
export class AsyncTaskInfoService extends Disposable {
  private readonly tasks: Map<string, AsyncTask>;
  private connection: Subscription | null;
  private onEvent: any;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoEventHandler: AsyncTaskInfoEventHandler,
  ) {
    super();
    this.tasks = new Map();
    this.connection = null;

    this.onEvent = asyncTaskInfoEventHandler.onEvent<WsAsyncTaskInfo>(ServerEventId.CbSessionTaskInfoUpdated, async data => {
      console.log('onEvent', data);
      // const task = this.tasks.get(data.taskId);

      // if (task?.pending && task.info) {
      //   await task.updateInfoAsync(async task => {
      //     const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({
      //       taskId: task.info!.id,
      //       removeOnFinish: false,
      //     });

      //     return taskInfo;
      //   });
      // }
    });
  }

  override dispose(): void {
    this.connection?.unsubscribe();
    this.onEvent.dispose();
  }

  create(getter: () => Promise<AsyncTaskInfo>): AsyncTask {
    const task = new AsyncTask(getter, this.cancelTask.bind(this));
    this.tasks.set(task.id, task);

    if (this.tasks.size === 1) {
      this.connection = this.asyncTaskInfoEventHandler.eventsSubject.connect();
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

    if (this.tasks.size === 0) {
      this.connection?.unsubscribe();
      this.connection = null;
    }

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

  private async cancelTask(info: AsyncTaskInfo): Promise<void> {
    await this.graphQLService.sdk.asyncTaskCancel({
      taskId: info.id,
    });
  }
}
