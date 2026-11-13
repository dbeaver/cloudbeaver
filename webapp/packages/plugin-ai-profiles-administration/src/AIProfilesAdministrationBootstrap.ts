/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AIAdministrationBootstrap, AIAdministrationTabsService, EAIAdministrationSub } from '@cloudbeaver/plugin-ai-administration';

const AIProfilesPanel = importLazyComponent(() => import('./AIProfiles/AIProfilesPanel.js').then(module => module.AIProfilesPanel));

export class AIProfilesAdministrationBootstrapImpl extends Bootstrap {
  constructor(
    private readonly aiAdministrationBootstrap: AIAdministrationBootstrap,
    private readonly aiAdministrationTabsService: AIAdministrationTabsService,
  ) {
    super();
  }

  override register(): void {
    this.aiAdministrationTabsService.tabsContainer.add({
      key: EAIAdministrationSub.Profiles,
      name: 'plugin_ai_administration_profiles_title',
      order: 2,
      panel: () => AIProfilesPanel,
    });

    this.aiAdministrationBootstrap.administrationItem.sub.push({ name: EAIAdministrationSub.Profiles });
  }
}

export type AIProfilesAdministrationBootstrap = AIProfilesAdministrationBootstrapImpl;

export class AIProfilesAdministrationBootstrapDI extends Context.Service<
  AIProfilesAdministrationBootstrapDI,
  AIProfilesAdministrationBootstrapImpl
>()('@cloudbeaver/plugin-ai-profiles-administration/AIProfilesAdministrationBootstrap#AIProfilesAdministrationBootstrap') {
  static readonly implementation = AIProfilesAdministrationBootstrapImpl;

  static readonly dependencies = () => [AIAdministrationBootstrap, AIAdministrationTabsService] as const;
  static readonly make: Effect.Effect<
    AIProfilesAdministrationBootstrapImpl,
    never,
    Context.Service.Identifier<typeof AIAdministrationBootstrap> | Context.Service.Identifier<typeof AIAdministrationTabsService>
  > = Effect.gen(function* makeAIProfilesAdministrationBootstrap() {
    const aiAdministrationBootstrap = yield* AIAdministrationBootstrap;
    const aiAdministrationTabsService = yield* AIAdministrationTabsService;

    return new AIProfilesAdministrationBootstrapImpl(aiAdministrationBootstrap, aiAdministrationTabsService);
  });
  static readonly layer: Layer.Layer<
    AIProfilesAdministrationBootstrapDI,
    never,
    Context.Service.Identifier<typeof AIAdministrationBootstrap> | Context.Service.Identifier<typeof AIAdministrationTabsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfilesAdministrationBootstrap = AIProfilesAdministrationBootstrapDI;
