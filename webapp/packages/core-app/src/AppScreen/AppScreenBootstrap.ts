/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AppScreen } from './AppScreen';
import { AppScreenService } from './AppScreenService';

@injectable()
export class AppScreenBootstrap extends Bootstrap {
  readonly activation: IExecutor;

  constructor(
    private readonly screenService: ScreenService
  ) {
    super();
    this.activation = new Executor();
  }

  register(): void {
    this.screenService.create({
      name: AppScreenService.screenName,
      routes: [{ name: AppScreenService.screenName, path: '/' }],
      component: AppScreen,
      root: true,
      onActivate: async () => { await this.activation.execute(); },
    });
  }

  load(): void | Promise<void> { }
}
