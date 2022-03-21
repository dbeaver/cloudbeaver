/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

import type { AsyncTaskInfo } from '../sdk';
import { ServerInternalError } from '../ServerInternalError';

export class AsyncTask {
  readonly id: string;

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

  private _cancelled: boolean;
  private taskInfo: AsyncTaskInfo | null;
  private resolve!: (value: AsyncTaskInfo) => void;
  private reject!: (reason?: any) => void;
  private innerPromise: Promise<AsyncTaskInfo>;
  private updatingAsync: boolean;
  private init: () => Promise<AsyncTaskInfo>;
  private cancel: (info: AsyncTaskInfo) => Promise<void>;
  private initPromise: Promise<void> | null;

  constructor(
    init: () => Promise<AsyncTaskInfo>,
    cancel: (info: AsyncTaskInfo) => Promise<void>
  ) {
    this.id = uuid();
    this.init = init;
    this.cancel = cancel;
    this._cancelled = false;
    this.updatingAsync = false;
    this.taskInfo = null;
    this.initPromise = null;

    this.innerPromise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });

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

  async updateInfoAsync(getter: (task: AsyncTask) => Promise<AsyncTaskInfo>): Promise<void> {
    if (this.updatingAsync) {
      return;
    }

    this.updatingAsync = true;
    try {
      const init = this.info === null;

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
      throw new Error('Can\'t cancel finished task');
    }

    this._cancelled = true;
    try {
      await this.cancelTask();
    } catch (exception: any) {
      this._cancelled = false;
      throw exception;
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
  }

  private async cancelTask(): Promise<void> {
    if (this.info) {
      await this.cancel(this.info);
    }
  }
}
