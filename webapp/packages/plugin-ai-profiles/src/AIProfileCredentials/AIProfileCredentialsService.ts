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
import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

@injectable(() => [CommonDialogService, NotificationService, AIProfilesResource, AiEnginesResource, AsyncTaskInfoService])
export class AIProfileCredentialsService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiEnginesResource: AiEnginesResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {}

  async open(profileId: string): Promise<DialogResult<void>> {
    const profile = await this.aiProfilesResource.load(profileId);

    if (!profile) {
      this.notificationService.logError({ title: 'plugin_ai_credentials_profile_not_found' });
      return { status: DialogueStateResult.Rejected };
    }

    const engines = await this.aiEnginesResource.load();
    const engine = engines.find(engine => engine.id === profile.engineId);

    return this.commonDialogService.open(AIProfileCredentialsDialog, {
      profileId: profile.id,
      profileName: profile.name,
      engineName: engine?.name ?? profile.engineId,
      engineIcon: engine?.icon,
    });
  }

  authorize(profileId: string, onAuthorization: (info: AiDeviceAuthorizationInfo) => void): ITask<boolean> {
    const task = this.asyncTaskInfoService.create(async () => {
      const info = await this.aiProfilesResource.startDeviceAuthorization(profileId);
      if (!authorization.cancelled) {
        onAuthorization(info);
      }
      return info.taskInfo;
    });

    const authorization: ITask<boolean> = new AutoRunningTask(
      async () => {
        try {
          const result = await this.asyncTaskInfoService.run(task);
          if (authorization.cancelled || result.taskResult !== true) {
            return false;
          }
          this.aiProfilesResource.markOutdated(profileId);
        } finally {
          if (!task.pending) {
            await this.asyncTaskInfoService.remove(task.id);
          }
        }
        return !authorization.cancelled;
      },
      () => (task.pending ? this.asyncTaskInfoService.cancel(task.id) : undefined),
    );
    return authorization;
  }

  isSupported(properties: ReadonlyArray<{ id?: string; features: readonly string[] }>): boolean {
    return properties.some(property => property.id === 'token' && property.features.includes('password'));
  }

  isRequired(profile: Pick<AIProfile, 'global' | 'credentialsSaved'>): boolean {
    return !profile.global && !profile.credentialsSaved;
  }
}

export const AI_ACCOUNT_AUTHENTICATION_REQUIRED = 'AI_ACCOUNT_AUTHENTICATION_REQUIRED';
