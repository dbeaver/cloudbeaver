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
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';

import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfileCredentialsDialog } from './AIProfileCredentialsDialogLazy.js';
import { AIProfileCredentialsFormService } from './AIProfileCredentialsFormService.js';
import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

@injectable(() => [
  CommonDialogService,
  NotificationService,
  AIProfilesResource,
  AiEnginesResource,
  AsyncTaskInfoService,
  AIProfileCredentialsFormService,
])
export class AIProfileCredentialsService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginesResource: AiEnginesResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly aiProfileCredentialsFormService: AIProfileCredentialsFormService,
  ) {}

  async open(profileId: string): Promise<DialogResult<void>> {
    const profile = await this.aiProfilesResource.load(profileId);

    if (!profile) {
      this.notificationService.logError({ title: 'plugin_ai_credentials_profile_not_found' });
      return { status: DialogueStateResult.Rejected };
    }

    const engines = await this.aiEnginesResource.load();
    const engine = engines.find(engine => engine.id === profile.engineId);

    const formState = this.aiProfileCredentialsFormService.create(profile.id);

    try {
      return await this.commonDialogService.open(AIProfileCredentialsDialog, {
        profileId: profile.id,
        profileName: profile.name,
        engineName: engine?.name ?? profile.engineId,
        engineIcon: engine?.icon,
        formState,
      });
    } finally {
      await formState.dispose();
    }
  }

  authorize(profileId: string): { authorization: Promise<AiDeviceAuthorizationInfo>; task: ITask<boolean> } {
    const authorization = this.aiProfilesResource.startDeviceAuthorization(profileId);
    const task = this.asyncTaskInfoService.create(async () => {
      const info = await authorization;
      return info.taskInfo;
    });

    const completion: ITask<boolean> = new AutoRunningTask(
      async () => {
        try {
          const result = await this.asyncTaskInfoService.run(task);
          if (result.taskResult !== true) {
            return false;
          }
          this.aiProfilesResource.markOutdated(profileId);
        } finally {
          if (!task.pending) {
            await this.asyncTaskInfoService.remove(task.id);
          }
        }
        return !completion.cancelled;
      },
      async () => {
        try {
          await task.run();
          if (task.pending) {
            await this.asyncTaskInfoService.cancel(task.id);
          }
        } catch (exception: any) {
          completion.cancelled = false;
          this.notificationService.logException(exception, 'plugin_ai_device_cancel_failed');
        }
      },
    );
    return { authorization, task: completion };
  }

  isSupported(properties: ReadonlyArray<{ id?: string; features: readonly string[] }>): boolean {
    return properties.some(property => property.id === 'token' && property.features.includes('password'));
  }

  isRequired(profile: Pick<AIProfile, 'global' | 'credentialsSaved'>): boolean {
    return !profile.global && !profile.credentialsSaved;
  }
}
