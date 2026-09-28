/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AIAdministrationBootstrap, AIAdministrationTabsService, EAIAdministrationSub } from '@cloudbeaver/plugin-ai-administration';

const AIProfilesPanel = importLazyComponent(() => import('./AIProfiles/AIProfilesPanel.js').then(module => module.AIProfilesPanel));

@injectable(() => [AIAdministrationBootstrap, AIAdministrationTabsService])
export class AIProfilesAdministrationBootstrap extends Bootstrap {
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
