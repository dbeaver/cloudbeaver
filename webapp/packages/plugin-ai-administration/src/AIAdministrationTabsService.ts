/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';
import { AIAdministrationBootstrap } from './AIAdministrationBootstrap.js';
import { EAIAdministrationSub } from './AIAdministrationNavigationService.js';

const AIAdministrationMainTabPanel = importLazyComponent(() =>
  import('./AIAdministrationMainTabPanel.js').then(module => module.AIAdministrationMainTabPanel),
);

export class AIAdministrationTabsServiceImpl extends Bootstrap {
  readonly tabsContainer: TabsContainer;

  constructor(private readonly aiAdministrationBootstrap: AIAdministrationBootstrap) {
    super();
    this.tabsContainer = new TabsContainer('AI Administration');
  }

  override register(): void {
    this.tabsContainer.add({
      key: EAIAdministrationSub.Settings,
      name: 'ui_settings',
      order: 1,
      panel: () => AIAdministrationMainTabPanel,
    });

    this.aiAdministrationBootstrap.administrationItem.sub.push({ name: EAIAdministrationSub.Settings });
  }
}

export type AIAdministrationTabsService = AIAdministrationTabsServiceImpl;

export class AIAdministrationTabsServiceDI extends Context.Service<AIAdministrationTabsServiceDI, AIAdministrationTabsServiceImpl>()(
  '@cloudbeaver/plugin-ai-administration/AIAdministrationTabsService#AIAdministrationTabsService',
) {
  static readonly implementation = AIAdministrationTabsServiceImpl;

  static readonly dependencies = () => [AIAdministrationBootstrap] as const;
  static readonly make: Effect.Effect<AIAdministrationTabsServiceImpl, never, Context.Service.Identifier<typeof AIAdministrationBootstrap>> =
    Effect.gen(function* makeAIAdministrationTabsService() {
      const aiAdministrationBootstrap = yield* AIAdministrationBootstrap;

      return new AIAdministrationTabsServiceImpl(aiAdministrationBootstrap);
    });
  static readonly layer: Layer.Layer<AIAdministrationTabsServiceDI, never, Context.Service.Identifier<typeof AIAdministrationBootstrap>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const AIAdministrationTabsService = AIAdministrationTabsServiceDI;
