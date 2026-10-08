/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable, runInAction } from 'mobx';

import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, type AsyncTask } from '@cloudbeaver/core-root';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';

import type { AIProfilesResource } from '../AIProfilesResource.js';

export class AIProfileAuthorizationController {
  authorization: AiDeviceAuthorizationInfo | null = null;
  processing = false;
  private task: AsyncTask | null = null;
  private disposed = false;

  constructor(
    private readonly profileId: string,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    makeObservable(this, {
      authorization: observable.ref,
      processing: observable,
    });
  }

  async connect(): Promise<void> {
    if (this.processing || this.disposed) {
      return;
    }

    this.processing = true;

    const task = this.asyncTaskInfoService.create(async () => {
      const info = await this.aiProfilesResource.startDeviceAuthorization(this.profileId);
      if (!this.disposed && !task.cancelled) {
        this.authorization = info;
      }
      return info.taskInfo;
    });
    this.task = task;
    try {
      const result = await this.asyncTaskInfoService.run(task);
      if (!task.cancelled && !this.disposed && result.taskResult === true) {
        this.aiProfilesResource.markOutdated(this.profileId);
        this.notificationService.logSuccess({ title: 'plugin_ai_account_connected', message: this.aiProfilesResource.get(this.profileId)?.name });
      }
    } catch (exception: any) {
      if (!task.cancelled && !this.disposed) {
        this.notificationService.logException(exception, 'plugin_ai_device_failed');
      }
    } finally {
      try {
        if (!task.pending) {
          await this.asyncTaskInfoService.remove(task.id);
        }
      } finally {
        this.task = null;
        runInAction(() => {
          this.authorization = null;
          this.processing = false;
        });
      }
    }
  }

  async confirmLeave(): Promise<boolean> {
    const task = this.task;
    if (!task?.pending || task.cancelled) {
      return true;
    }
    const { status } = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_ai_device_cancel_title',
      message: 'plugin_ai_device_cancel_confirmation',
      confirmActionText: 'plugin_ai_device_cancel',
      cancelActionText: 'plugin_ai_device_continue',
    });
    return status === DialogueStateResult.Resolved && this.cancel(task);
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    if (this.task) {
      await this.cancel(this.task);
    }
  }

  private async cancel(task: AsyncTask): Promise<boolean> {
    try {
      if (task.pending && !task.cancelled) {
        await this.asyncTaskInfoService.cancel(task.id);
      }
      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_ai_device_cancel_failed');
      return false;
    }
  }
}
