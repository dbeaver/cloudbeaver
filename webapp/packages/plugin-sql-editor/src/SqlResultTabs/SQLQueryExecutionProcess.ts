/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NotificationService } from '@cloudbeaver/core-events';
import {
  AsyncTaskInfo, GraphQLService, ServerInternalError, SqlExecuteInfo, SqlDataFilter,
} from '@cloudbeaver/core-sdk';
import {
  CancellablePromise, cancellableTimeout, Deferred, EDeferredState,
} from '@cloudbeaver/core-utils';

import { ISqlQueryParams } from '../ISqlEditorTabState';

const DELAY_BETWEEN_TRIES = 1000;

export class SQLQueryExecutionProcess extends Deferred<SqlExecuteInfo> {

  private taskId?: string;
  private timeout?: CancellablePromise<void>;
  private isCancelConfirmed = false; // true when server successfully executed cancelQueryAsync

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService
  ) {
    super();
  }

  async start(
    sqlQueryParams: ISqlQueryParams,
    filter: SqlDataFilter
  ): Promise<void> {
    // start async task
    try {
      const taskInfo = await this.executeQueryAsync(sqlQueryParams, filter);
      await this.applyResult(taskInfo);
      this.taskId = taskInfo.id;
      if (this.getState() === EDeferredState.CANCELLING) {
        await this.cancelAsync(this.taskId);
      }
    } catch (e) {
      this.onError(e);
      return;
    }

    if (this.isFinished) {
      return;
    }

    // check async task status until execution finished
    while (this.isInProgress) {
      if (this.getState() === EDeferredState.CANCELLING) {
        await this.cancelAsync(this.taskId);
      }
      // run the first check immediately because usually the query execution is fast
      try {
        const taskInfo = await this.getQueryStatusAsync(this.taskId);
        await this.applyResult(taskInfo);
        if (this.isFinished) {
          return;
        }
      } catch (e) {
        this.notificationService.logException(e, 'Failed to check async task status');
      }

      try {
        this.timeout = cancellableTimeout(DELAY_BETWEEN_TRIES);
        await this.timeout;
      } catch {
      }
    }
  }

  /**
   * this method just mark process as cancelling
   * to avoid racing conditions the server request will be executed in sinchronious manner in start method
   */
  async cancel(): Promise<void> {
    if (this.getState() !== EDeferredState.PENDING) {
      return;
    }
    this.toCancelling();
    if (this.timeout) {
      this.timeout.cancel();
    }
  }

  private async cancelAsync(taskId: string) {
    if (this.isCancelConfirmed) {
      return;
    }
    try {
      await this.cancelQueryAsync(taskId);
      this.isCancelConfirmed = true;
    } catch (e) {
      if (this.getState() === EDeferredState.CANCELLING) {
        this.toPending();
        this.notificationService.logException(e, 'Failed to cancel async task');
      }
    }
  }

  private async executeQueryAsync(
    sqlQueryParams: ISqlQueryParams,
    filter: SqlDataFilter,
  ): Promise<AsyncTaskInfo> {
    const { taskInfo } = await this.graphQLService.sdk.asyncSqlExecuteQuery({
      connectionId: sqlQueryParams.connectionId,
      contextId: sqlQueryParams.contextId,
      query: sqlQueryParams.query,
      filter,
    });
    return taskInfo;
  }

  private async getQueryStatusAsync(taskId: string): Promise<AsyncTaskInfo> {
    const { taskInfo } = await this.graphQLService.sdk.getAsyncTaskInfo({ taskId, removeOnFinish: false });
    return taskInfo;
  }

  private async cancelQueryAsync(taskId: string): Promise<void> {
    await this.graphQLService.sdk.asyncTaskCancel({ taskId });
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
    try {
    // task execution successful
      const { result } = await this.graphQLService.sdk.getSqlExecuteTaskResults({ taskId: taskInfo.id });
      this.toResolved(result);
      await this.graphQLService.sdk.getAsyncTaskInfo({ taskId: taskInfo.id, removeOnFinish: true });
    } catch (exception) {
      this.onError(new Error('Tasks execution returns no result'), exception);
    }
  }

  private onError(error: Error, status?: string) {
    // if task failed to execute during cancelling - it means it was cancelled successfully
    if (this.getState() === EDeferredState.CANCELLING) {
      this.toCancelled();
      const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
      this.notificationService.logException(error, message);
    } else {
      this.toRejected(error);
    }
  }
}
