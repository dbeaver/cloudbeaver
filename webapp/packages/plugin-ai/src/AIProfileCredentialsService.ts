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

import { AiEnginesResource } from './AiEnginesResource.js';
import { AIProfileCredentialsDialog } from './AIProfileCredentialsDialogLazy.js';
import { UserAIProfileResource } from './UserAIProfileResource.js';

@injectable(() => [CommonDialogService, NotificationService, UserAIProfileResource, AiEnginesResource])
export class AIProfileCredentialsService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly userAIProfileResource: UserAIProfileResource,
    private readonly aiEnginesResource: AiEnginesResource,
  ) {}

  async open(profileId: string): Promise<DialogResult<void>> {
    const [profile] = await Promise.all([this.userAIProfileResource.load(profileId), this.aiEnginesResource.load()]);

    if (!profile) {
      this.notificationService.logError({ title: 'plugin_ai_credentials_profile_not_found' });
      return { status: DialogueStateResult.Rejected };
    }

    const engine = this.aiEnginesResource.data.find(engine => engine.id === profile.engineId);
    return this.commonDialogService.open(AIProfileCredentialsDialog, {
      profileId: profile.id,
      profileName: profile.name,
      engineName: engine?.name ?? profile.engineId,
      engineIcon: engine?.icon,
      credentialsSaved: profile.credentialsSaved,
    });
  }
}

export { AIProfileCredentialsService as AIProfileCredentialsDialogService };
