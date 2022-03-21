/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NotificationService } from '@cloudbeaver/core-events';
import {
  AsyncTaskInfo, GraphQLService, ServerInternalError, DataTransferParameters
} from '@cloudbeaver/core-sdk';
import {
  CancellablePromise, cancellableTimeout, Deferred, EDeferredState
} from '@cloudbeaver/core-utils';

const DELAY_BETWEEN_TRIES = 1000;

// TODO: seems we need special abstraction over async tasks to manage it
export class ExportFromResultsProcess extends Deferred<string> {
  private taskId?: string;
  private timeout?: CancellablePromise<void>;
  private isCancelConfirmed = false; // true when server successfully executed cancelQueryAsync

  constructor(private graphQLService: GraphQLService,
    private notificationService: NotificationService) {
    super();
  }

  async start(
    connectionId: string,
    contextId: string,
    resultsId: string,
    parameters: DataTransferParameters
  ): Promise<string> {
    // start async task
    try {
      const { taskInfo } = await this.graphQLService.sdk.exportDataFromResults({
        connectionId,
        contextId,
        resultsId,
        parameters,
      });
      await this.applyResult(taskInfo);
      this.taskId = taskInfo.id;
      if (this.getState() === EDeferredState.CANCELLING) {
        await this.cancelAsync(this.taskId);
      }

      this.statusUpdateProcess();

      return this.taskId;
    } catch (e: any) {
      this.onError(e);
      throw e;
    }
  }

  /**
   * this method just mark process as cancelling
   * to avoid racing conditions the server request will be executed in synchronous manner in start method
   */
  cancel() {
    if (this.getState() !== EDeferredState.PENDING) {
      return;
    }
    this.toCancelling();
    if (this.timeout) {
      this.timeout.cancel();
    }
  }

  private async statusUpdateProcess() {
    if (this.isFinished || !this.taskId) {
      return;
    }
    // check async task status until execution finished
    while (this.isInProgress) {
      if (this.getState() === EDeferredState.CANCELLING) {
        await this.cancelAsync(this.taskId);
      }
      // run the first check immediately because usually the query execution is fast
      try {
        const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({
          taskId: this.taskId,
          removeOnFinish: false,
        });
        await this.applyResult(taskInfo);
        if (this.isFinished) {
          return;
        }
      } catch (e: any) {
        this.notificationService.logException(e, 'Failed to check async task status');
      }

      try {
        this.timeout = cancellableTimeout(DELAY_BETWEEN_TRIES);
        await this.timeout;
      } catch { }
    }
  }

  private async cancelAsync(taskId: string) {
    if (this.isCancelConfirmed) {
      return;
    }
    try {
      await this.graphQLService.sdk.asyncTaskCancel({ taskId });
      this.isCancelConfirmed = true;
    } catch (e: any) {
      if (this.getState() === EDeferredState.CANCELLING) {
        this.toPending();
        this.notificationService.logException(e, 'Failed to cancel async task');
      }
    }
  }

  private async applyResult(taskInfo: AsyncTaskInfo) {
    // task is running
    if (taskInfo.running) {
      return;
    }
    // task failed to execute
    if (taskInfo.error) {
      const serverError = new ServerInternalError(taskInfo.error);
      this.onError(serverError, taskInfo.status);
      return;
    }
    if (!taskInfo.taskResult) {
      this.onError(new Error('Tasks execution returns no taskResult'), taskInfo.status);
      return;
    }
    // task execution successful
    this.toResolved(taskInfo.taskResult);
    await this.graphQLService.sdk.getAsyncTaskInfo({ taskId: taskInfo.id, removeOnFinish: true });
  }

  private onError(error: Error, status?: string) {
    // if task failed to execute during cancelling - it means it was cancelled successfully
    if (this.getState() === EDeferredState.CANCELLING) {
      this.toCancelled(error);
    } else {
      this.toRejected(error);
    }
  }
}
