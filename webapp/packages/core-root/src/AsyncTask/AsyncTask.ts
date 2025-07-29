/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type AsyncTaskInfo, ServerInternalError, type WsAsyncTaskInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

export class AsyncTask {
  get cancelled(): boolean {
    return this._cancelled;
  }

  get info(): AsyncTaskInfo | null {
    return this.taskInfo;
  }

  get pending(): boolean {
    return this.taskInfo?.running || this.updatingAsync || false;
  }

  get promise(): Promise<AsyncTaskInfo> {
    return this.innerPromise;
  }

  get id(): string {
    return this._id;
  }

  readonly onStatusChange: ISyncExecutor<AsyncTaskInfo>;

  private _id: string;
  private _cancelled: boolean;
  private taskInfo: AsyncTaskInfo | null;
  private resolve!: (value: AsyncTaskInfo) => void;
  private reject!: (reason?: any) => void;
  private readonly innerPromise: Promise<AsyncTaskInfo>;
  private updatingAsync: boolean;
  private readonly init: () => Promise<AsyncTaskInfo>;
  private readonly cancel: (id: string) => Promise<void>;
  private initPromise: Promise<void> | null;

  constructor(init: () => Promise<AsyncTaskInfo>, cancel: (id: string) => Promise<void>) {
    this._id = uuid();
    this.init = init;
    this.cancel = cancel;
    this._cancelled = false;
    this.updatingAsync = false;
    this.taskInfo = null;
    this.initPromise = null;
    this.onStatusChange = new SyncExecutor();

    const innerPromise = Promise.withResolvers<AsyncTaskInfo>();
    this.innerPromise = innerPromise.promise;
    this.resolve = innerPromise.resolve;
    this.reject = innerPromise.reject;

    makeObservable<this, 'pending' | '_cancelled' | 'taskInfo' | 'updatingAsync'>(this, {
      _cancelled: observable,
      pending: computed,
      taskInfo: observable,
      updatingAsync: observable,
    });
  }

  async run(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.updateInfoAsync(this.init);

    await this.initPromise;
  }

  /**
   * Asynchronously updates the task information using the provided getter function.
   * If the task is already finished, the update is skipped to avoid redundant status updates.
   * This prevents unnecessary updates in scenarios where the task was already completed
   * during the initial request, and a subsequent status event is received.
   *
   * @param getter - A function that retrieves the latest AsyncTaskInfo for this task.
   * @returns A promise that resolves when the update is complete.
   */
  async updateInfoAsync(getter: (task: AsyncTask) => Promise<AsyncTaskInfo>): Promise<void> {
    const init = this.info === null;

    if (this.updatingAsync) {
      if (!init) {
        /* With websockets we encounter a situation when we receive status update before the task is initialized.
        We save the update in pendingEvents, but we can't update the task because updatingAsync is still true,
        so we need to wait a bit before retrying */
        setTimeout(() => this.updateInfoAsync.call(this, getter), 100);
      }
      return;
    }

    if (this.info?.running === false) {
      // If the task is finished, we don't need to update it again
      return;
    }

    this.updatingAsync = true;
    try {
      if (this._cancelled && init) {
        throw new Error('Task was cancelled');
      }

      const info = await getter(this);
      this.updateInfo(info);

      if (init && this._cancelled) {
        await this.cancelTask();
      }
    } finally {
      this.updatingAsync = false;
    }
  }

  async cancelAsync(): Promise<void> {
    if (this._cancelled) {
      return;
    }

    if (!this.pending) {
      throw new Error("Can't cancel finished task");
    }

    this._cancelled = true;
    try {
      await this.cancelTask();
    } catch (exception: any) {
      this._cancelled = false;
      throw exception;
    }
  }

  public updateStatus(info: WsAsyncTaskInfo): void {
    if (this.taskInfo) {
      this.taskInfo.status = info.statusName;
      this.onStatusChange.execute(this.taskInfo);
    }
  }

  private updateInfo(info: AsyncTaskInfo): void {
    this.taskInfo = info;

    if (!info.running) {
      if (info.error) {
        this.reject(new ServerInternalError(info.error));
      } else {
        this.resolve(info);
      }
    }
    this.onStatusChange.execute(this.taskInfo);
  }

  private async cancelTask(): Promise<void> {
    if (this.info) {
      await this.cancel(this.info.id);
    }
  }
}
