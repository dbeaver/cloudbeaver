/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppScreenService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NavigationTabsSettingsService } from './NavigationTabs/NavigationTabsSettingsService.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

const NavigationTabsBar = importLazyComponent(() => import('./NavigationTabs/NavigationTabsBar/index.js').then(m => m.NavigationTabsBar));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly appScreenService: AppScreenService,
    private readonly navigationTabsSettingsService: NavigationTabsSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.appScreenService.rightAreaTop.add(NavigationTabsBar);
    this.navigationTabsSettingsService.registerSettingsUI();
  }
}
