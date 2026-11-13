/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { AIProfileCredentialsPanelService } from '../AIProfileCredentialsPanelService.js';

const AIProfileCredentialsTab = importLazyComponent(() =>
  import('../components/AIProfileCredentialsTab.js').then(module => module.AIProfileCredentialsTab),
);

export class AIProfileCredentialsFormTabBootstrapImpl extends Bootstrap {
  constructor(private readonly aiProfileCredentialsPanelService: AIProfileCredentialsPanelService) {
    super();
  }

  override register(): void {
    this.aiProfileCredentialsPanelService.parts.add({
      key: 'credentials',
      name: 'plugin_ai_credentials_profile',
      panel: () => AIProfileCredentialsTab,
    });
  }
}

export type AIProfileCredentialsFormTabBootstrap = AIProfileCredentialsFormTabBootstrapImpl;

export class AIProfileCredentialsFormTabBootstrapDI extends Context.Service<
  AIProfileCredentialsFormTabBootstrapDI,
  AIProfileCredentialsFormTabBootstrapImpl
>()('@cloudbeaver/plugin-ai-user-profile/AIProfileCredentialsForm/AIProfileCredentialsFormTabBootstrap#AIProfileCredentialsFormTabBootstrap') {
  static readonly implementation = AIProfileCredentialsFormTabBootstrapImpl;

  static readonly dependencies = () => [AIProfileCredentialsPanelService] as const;
  static readonly make: Effect.Effect<
    AIProfileCredentialsFormTabBootstrapImpl,
    never,
    Context.Service.Identifier<typeof AIProfileCredentialsPanelService>
  > = Effect.gen(function* makeAIProfileCredentialsFormTabBootstrap() {
    const aiProfileCredentialsPanelService = yield* AIProfileCredentialsPanelService;

    return new AIProfileCredentialsFormTabBootstrapImpl(aiProfileCredentialsPanelService);
  });
  static readonly layer: Layer.Layer<
    AIProfileCredentialsFormTabBootstrapDI,
    never,
    Context.Service.Identifier<typeof AIProfileCredentialsPanelService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfileCredentialsFormTabBootstrap = AIProfileCredentialsFormTabBootstrapDI;
