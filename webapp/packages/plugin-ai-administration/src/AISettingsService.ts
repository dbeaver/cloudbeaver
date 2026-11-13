/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationAISettingsFormService } from './AISettingsForm/AdministrationAISettingsFormService.js';
import { AdministrationAISettingsFormState } from './AISettingsForm/AdministrationAISettingsFormState.js';

export class AISettingsServiceImpl {
  formState: AdministrationAISettingsFormState | null;

  constructor(
    private readonly administrationAISettingsFormService: AdministrationAISettingsFormService,
    private readonly serviceProvider: IServiceProvider,
  ) {
    this.formState = null;
  }

  create(): void {
    this.dispose();
    this.formState = new AdministrationAISettingsFormState(this.serviceProvider, this.administrationAISettingsFormService);
    this.formState.setMode(FormMode.Edit);
  }

  dispose(): void {
    this.formState?.dispose();
    this.formState = null;
  }
}

export type AISettingsService = AISettingsServiceImpl;

export class AISettingsServiceDI extends Context.Service<AISettingsServiceDI, AISettingsServiceImpl>()(
  '@cloudbeaver/plugin-ai-administration/AISettingsService#AISettingsService',
) {
  static readonly implementation = AISettingsServiceImpl;

  static readonly dependencies = () => [AdministrationAISettingsFormService, IServiceProvider] as const;
  static readonly make: Effect.Effect<
    AISettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof AdministrationAISettingsFormService> | Context.Service.Identifier<typeof IServiceProvider>
  > = Effect.gen(function* makeAISettingsService() {
    const administrationAISettingsFormService = yield* AdministrationAISettingsFormService;
    const serviceProvider = yield* IServiceProvider;

    return new AISettingsServiceImpl(administrationAISettingsFormService, serviceProvider);
  });
  static readonly layer: Layer.Layer<
    AISettingsServiceDI,
    never,
    Context.Service.Identifier<typeof AdministrationAISettingsFormService> | Context.Service.Identifier<typeof IServiceProvider>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AISettingsService = AISettingsServiceDI;
