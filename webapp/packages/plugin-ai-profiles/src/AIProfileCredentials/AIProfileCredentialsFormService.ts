/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState } from '@cloudbeaver/core-ui';

import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export class AIProfileCredentialsFormServiceImpl extends FormBaseService<IAIProfileCredentialsFormState> {
  private formState: FormState<IAIProfileCredentialsFormState> | null = null;

  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly serviceProvider: IServiceProvider,
  ) {
    super(localizationService, notificationService, 'AIProfileCredentialsForm');
  }

  create(profileId: string): FormState<IAIProfileCredentialsFormState> | null {
    if (this.formState) {
      return null;
    }

    this.formState = new FormState(this.serviceProvider, this, { profileId }).setMode(FormMode.Edit);
    this.formState.disposeTask.addHandler(() => {
      this.formState = null;
    });

    return this.formState;
  }
}

export type AIProfileCredentialsFormService = AIProfileCredentialsFormServiceImpl;

export class AIProfileCredentialsFormServiceDI extends Context.Service<AIProfileCredentialsFormServiceDI, AIProfileCredentialsFormServiceImpl>()(
  '@cloudbeaver/plugin-ai-profiles/AIProfileCredentials/AIProfileCredentialsFormService#AIProfileCredentialsFormService',
) {
  static readonly implementation = AIProfileCredentialsFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService, IServiceProvider] as const;
  static readonly make: Effect.Effect<
    AIProfileCredentialsFormServiceImpl,
    never,
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof IServiceProvider>
  > = Effect.gen(function* makeAIProfileCredentialsFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;
    const serviceProvider = yield* IServiceProvider;

    return new AIProfileCredentialsFormServiceImpl(localizationService, notificationService, serviceProvider);
  });
  static readonly layer: Layer.Layer<
    AIProfileCredentialsFormServiceDI,
    never,
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof IServiceProvider>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfileCredentialsFormService = AIProfileCredentialsFormServiceDI;
