/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIProfileCredentialsDialog } from './AIProfileCredentialsDialogLazy.js';
import { AIProfileCredentialsFormService } from './AIProfileCredentialsFormService.js';
import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';

@injectable(() => [CommonDialogService, NotificationService, AIProfilesResource, AIProfileCredentialsFormService])
export class AIProfileCredentialsService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiProfileCredentialsFormService: AIProfileCredentialsFormService,
  ) {}

  async open(profileId: string): Promise<DialogResult<void> | undefined> {
    const profile = await this.aiProfilesResource.load(profileId);

    if (!profile) {
      this.notificationService.logError({ title: 'plugin_ai_credentials_profile_not_found' });
      return;
    }

    const formState = this.aiProfileCredentialsFormService.create(profile.id);
    if (!formState) {
      return;
    }

    try {
      return await this.commonDialogService.open(AIProfileCredentialsDialog, { formState }, { persistent: true });
    } finally {
      await formState.dispose();
    }
  }

  isSupported(properties: ReadonlyArray<{ id?: string; features: readonly string[] }>): boolean {
    return properties.some(property => property.id === 'token' && property.features.includes('password'));
  }

  isRequired(profile: Pick<AIProfile, 'global' | 'credentialsSaved'>): boolean {
    return !profile.global && !profile.credentialsSaved;
  }
}
