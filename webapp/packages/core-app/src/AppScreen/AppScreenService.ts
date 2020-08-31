/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AppScreen } from './AppScreen';

@injectable()
export class AppScreenService extends Bootstrap {

  static screenName = 'app'

  constructor(
    private screenService: ScreenService,
  ) {
    super();
  }

  register() {
    this.screenService.create({
      name: AppScreenService.screenName,
      routes: [{ name: AppScreenService.screenName, path: '/' }],
      component: AppScreen,
      root: true,
    });
  }

  load(): void | Promise<void> { }
}
