/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { AIProfileFormService } from './AIProfileFormService.js';

const AIProfileOptions = importLazyComponent(() => import('./Options/AIProfileOptions.js').then(m => m.AIProfileOptions));

export class AIProfileFormTabBootstrapImpl extends Bootstrap {
  constructor(private readonly aiProfileFormService: AIProfileFormService) {
    super();
  }

  override register(): void {
    this.aiProfileFormService.parts.add({
      key: 'options',
      name: 'plugin_ai_administration_profile_form_tab_options',
      order: 1,
      panel: () => AIProfileOptions,
    });
  }
}

export type AIProfileFormTabBootstrap = AIProfileFormTabBootstrapImpl;

export class AIProfileFormTabBootstrapDI extends Context.Service<AIProfileFormTabBootstrapDI, AIProfileFormTabBootstrapImpl>()(
  '@cloudbeaver/plugin-ai-profiles-administration/AIProfiles/AIProfileForm/AIProfileFormTabBootstrap#AIProfileFormTabBootstrap',
) {
  static readonly implementation = AIProfileFormTabBootstrapImpl;

  static readonly dependencies = () => [AIProfileFormService] as const;
  static readonly make: Effect.Effect<AIProfileFormTabBootstrapImpl, never, Context.Service.Identifier<typeof AIProfileFormService>> = Effect.gen(
    function* makeAIProfileFormTabBootstrap() {
      const aiProfileFormService = yield* AIProfileFormService;

      return new AIProfileFormTabBootstrapImpl(aiProfileFormService);
    },
  );
  static readonly layer: Layer.Layer<AIProfileFormTabBootstrapDI, never, Context.Service.Identifier<typeof AIProfileFormService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfileFormTabBootstrap = AIProfileFormTabBootstrapDI;
