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

import type { Unsubscribe } from '../ServerEventEmitter/IServerEventEmitter.js';
import { ServerEventId } from '../SessionEventSource.js';
import { AsyncTask } from './AsyncTask.js';
import { AsyncTaskInfoEventHandler } from './AsyncTaskInfoEventHandler.js';

@injectable()
export class AsyncTaskInfoService extends Disposable {
  private readonly tasks: Map<string, AsyncTask>;
  private readonly taskIdAliases: Map<string, string>;
  private readonly pendingEvents: Map<string, WsAsyncTaskInfo>;
  private connection: Subscription | null;
  private onEventUnsubscribe: Unsubscribe | null;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoEventHandler: AsyncTaskInfoEventHandler,
  ) {
    super();
    this.tasks = new Map();
    this.taskIdAliases = new Map();
    this.pendingEvents = new Map();
    this.connection = null;
    this.handleEvent = this.handleEvent.bind(this);

    this.onEventUnsubscribe = asyncTaskInfoEventHandler.onEvent<WsAsyncTaskInfo>(ServerEventId.CbSessionTaskInfoUpdated, this.handleEvent);
  }

  private async updateTask(task: AsyncTask, data: WsAsyncTaskInfo) {
    if (data.running === false) {
      await task.updateInfoAsync(async () => {
        const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({
          taskId: data.taskId,
          removeOnFinish: false,
        });

        return taskInfo;
      });
    } else {
      task.updateStatus(data);
    }
  }

  private async handleEvent(data: WsAsyncTaskInfo) {
    const task = this.getTask(data.taskId);

    if (!task) {
      this.pendingEvents.set(data.taskId, data);
      return;
    }

    await this.updateTask(task, data);
  }

  override dispose(): void {
    this.connection?.unsubscribe();
    this.onEventUnsubscribe?.();
  }

  create(getter: () => Promise<AsyncTaskInfo>): AsyncTask {
    const task = new AsyncTask(getter, this.cancelTask.bind(this));

    this.tasks.set(task.id, task);
    task.onStatusChange.addHandler(info => {
      if (this.taskIdAliases.get(info.id)) {
        return;
      }

      this.taskIdAliases.set(info.id, task.id);

      const pendingEvent = this.pendingEvents.get(info.id);
      if (pendingEvent) {
        this.pendingEvents.delete(info.id);
        this.updateTask(task, pendingEvent);
      }
    });

    if (this.tasks.size === 1) {
      this.connection = this.asyncTaskInfoEventHandler.eventsSubject.connect();
    }

    return task;
  }

  private getTask(taskId: string): AsyncTask | undefined {
    let task = this.tasks.get(taskId);

    if (!task) {
      const internalId = this.taskIdAliases.get(taskId);

      if (internalId) {
        task = this.tasks.get(internalId);
      }
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
    const task = this.getTask(taskId);

    if (!task) {
      return;
    }

    if (task.pending) {
      throw new Error('Cant remove unfinished task');
    }
    this.tasks.delete(task.id);
    if (task.info) {
      this.taskIdAliases.delete(task.info.id);
      this.pendingEvents.delete(task.info.id);
    }
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
    const task = this.getTask(taskId);

    await task?.cancelAsync();
  }

  private async cancelTask(id: string): Promise<void> {
    await this.graphQLService.sdk.asyncTaskCancel({
      taskId: id,
    });
  }
}
