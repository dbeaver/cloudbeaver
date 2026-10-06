/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, type AsyncTask } from '@cloudbeaver/core-root';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';

import { AIProfileCredentialsDialog } from './AIProfileCredentialsDialogLazy.js';
import { AIProfileCredentialsFormService } from './AIProfileCredentialsFormService.js';
import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

@injectable(() => [
  CommonDialogService,
  NotificationService,
  AIProfilesResource,
  AsyncTaskInfoService,
  AIProfileCredentialsFormService,
])
export class AIProfileCredentialsService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly aiProfileCredentialsFormService: AIProfileCredentialsFormService,
  ) {}

  async open(profileId: string): Promise<DialogResult<void>> {
    const profile = await this.aiProfilesResource.load(profileId);

    if (!profile) {
      this.notificationService.logError({ title: 'plugin_ai_credentials_profile_not_found' });
      return { status: DialogueStateResult.Rejected };
    }

    const formState = this.aiProfileCredentialsFormService.create(profile.id);
    if (!formState) {
      return { status: DialogueStateResult.Rejected };
    }

    try {
      return await this.commonDialogService.open(AIProfileCredentialsDialog, {
        formState,
      });
    } finally {
      await formState.dispose();
    }
  }

  authorize(profileId: string, onAuthorization: (info: AiDeviceAuthorizationInfo) => void): AsyncTask {
    return this.asyncTaskInfoService.create(async () => {
      const info = await this.aiProfilesResource.startDeviceAuthorization(profileId);
      onAuthorization(info);
      return info.taskInfo;
    });
  }

  async connect(profileId: string, task: AsyncTask): Promise<boolean> {
    try {
      const result = await this.asyncTaskInfoService.run(task);
      if (task.cancelled || result.taskResult !== true) {
        return false;
      }
      this.aiProfilesResource.markOutdated(profileId);
      return true;
    } finally {
      if (!task.pending) {
        await this.asyncTaskInfoService.remove(task.id);
      }
    }
  }

  async cancelAuthorization(task: AsyncTask): Promise<void> {
    try {
      if (task.pending) {
        await this.asyncTaskInfoService.cancel(task.id);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_ai_device_cancel_failed');
    }
  }

  isSupported(properties: ReadonlyArray<{ id?: string; features: readonly string[] }>): boolean {
    return properties.some(property => property.id === 'token' && property.features.includes('password'));
  }

  isRequired(profile: Pick<AIProfile, 'global' | 'credentialsSaved'>): boolean {
    return !profile.global && !profile.credentialsSaved;
  }
}
