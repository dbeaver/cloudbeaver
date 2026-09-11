/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { EAIAdministrationSub } from './AIAdministrationNavigationService.js';
import { AIAdministrationBootstrap } from './AIAdministrationBootstrap.js';

const AIAdministrationMainTabPanel = importLazyComponent(() =>
  import('./AIAdministrationMainTabPanel.js').then(module => module.AIAdministrationMainTabPanel),
);

@injectable(() => [AIAdministrationBootstrap])
export class AIAdministrationTabsService extends Bootstrap {
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
