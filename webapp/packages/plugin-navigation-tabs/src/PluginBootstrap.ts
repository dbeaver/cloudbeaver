/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AppScreenService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

const NavigationTabsBar = React.lazy(async () => {
  const { NavigationTabsBar } = await import('./NavigationTabs/NavigationTabsBar/index.js');
  return { default: NavigationTabsBar };
});

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly appScreenService: AppScreenService) {
    super();
  }

  override register(): void | Promise<void> {
    this.appScreenService.rightAreaTop.add(NavigationTabsBar);
  }
}
