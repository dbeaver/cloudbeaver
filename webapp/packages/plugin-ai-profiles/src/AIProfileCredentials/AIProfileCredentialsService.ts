/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';
import { AIProfileCredentialsDialog } from './AIProfileCredentialsDialogLazy.js';
import { AIProfileCredentialsFormService } from './AIProfileCredentialsFormService.js';

export class AIProfileCredentialsServiceImpl {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiProfileCredentialsFormService: AIProfileCredentialsFormService,
  ) {}

  async open(profileId: string, onSuccess?: () => void | Promise<void>): Promise<DialogResult<void> | undefined> {
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
      return await this.commonDialogService.open(AIProfileCredentialsDialog, { formState, onSuccess }, { persistent: true });
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

export type AIProfileCredentialsService = AIProfileCredentialsServiceImpl;

export class AIProfileCredentialsServiceDI extends Context.Service<AIProfileCredentialsServiceDI, AIProfileCredentialsServiceImpl>()(
  '@cloudbeaver/plugin-ai-profiles/AIProfileCredentials/AIProfileCredentialsService#AIProfileCredentialsService',
) {
  static readonly implementation = AIProfileCredentialsServiceImpl;

  static readonly dependencies = () => [CommonDialogService, NotificationService, AIProfilesResource, AIProfileCredentialsFormService] as const;
  static readonly make: Effect.Effect<
    AIProfileCredentialsServiceImpl,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof AIProfileCredentialsFormService>
  > = Effect.gen(function* makeAIProfileCredentialsService() {
    const commonDialogService = yield* CommonDialogService;
    const notificationService = yield* NotificationService;
    const aiProfilesResource = yield* AIProfilesResource;
    const aiProfileCredentialsFormService = yield* AIProfileCredentialsFormService;

    return new AIProfileCredentialsServiceImpl(commonDialogService, notificationService, aiProfilesResource, aiProfileCredentialsFormService);
  });
  static readonly layer: Layer.Layer<
    AIProfileCredentialsServiceDI,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof AIProfilesResource>
    | Context.Service.Identifier<typeof AIProfileCredentialsFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfileCredentialsService = AIProfileCredentialsServiceDI;
