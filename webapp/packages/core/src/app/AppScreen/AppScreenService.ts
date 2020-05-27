/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';

import { RouterService } from '../RouterService';
import { ScreenService } from '../Screen/ScreenService';
import { AppScreen } from './AppScreen';

@injectable()
export class AppScreenService {

  static screenName = 'app'

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
  ) {}

  navigateToRoot() {
    this.routerService.router.navigate(AppScreenService.screenName);
  }

  register() {
    this.screenService.create({
      name: AppScreenService.screenName,
      routes: [{ name: AppScreenService.screenName, path: '/' }],
      component: AppScreen,
    });
  }
}
