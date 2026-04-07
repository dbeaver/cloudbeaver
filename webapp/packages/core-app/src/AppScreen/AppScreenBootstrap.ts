/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AppScreenService } from './AppScreenService.js';
import { SkipNavService } from './SkipNavService.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

const AppScreen = importLazyComponent(() => import('./AppScreen.js').then(m => m.AppScreen));

@injectable(() => [ScreenService, SkipNavService])
export class AppScreenBootstrap extends Bootstrap {
  readonly activation: IExecutor;

  constructor(
    private readonly screenService: ScreenService,
    private readonly skipNavService: SkipNavService,
  ) {
    super();
    this.activation = new Executor();
  }

  override register(): void {
    this.screenService.create({
      name: AppScreenService.screenName,
      routes: [{ name: AppScreenService.screenName, path: '/' }],
      component: AppScreen,
      root: true,
      onActivate: async () => {
        await this.activation.execute();
      },
    });

    this.skipNavService.registerLinks();
  }
}
