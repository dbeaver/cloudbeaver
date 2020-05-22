/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ScreenService, RouterService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';

import { AdministrationScreen } from './AdministrationScreen';

@injectable()
export class AdministrationScreenService {

  static screenName = 'administration'

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
  ) {}

  navigateToRoot() {
    return this.routerService.router.navigate(AdministrationScreenService.screenName);
  }

  register() {
    this.screenService.add({ name: AdministrationScreenService.screenName, path: '/admin', component: AdministrationScreen });
  }
}
