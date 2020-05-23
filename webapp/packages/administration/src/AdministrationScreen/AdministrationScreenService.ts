/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ScreenService, RouterService, AppScreenService } from '@dbeaver/core/app';
import { injectable, Bootstrap } from '@dbeaver/core/di';
import { PermissionsService } from '@dbeaver/core/root';

import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreen } from './AdministrationScreen';

@injectable()
export class AdministrationScreenService extends Bootstrap {

  static screenName = 'administration'

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
    private permissionsService: PermissionsService,
    private appScreenService: AppScreenService
  ) {
    super();
    this.permissionsService.onUpdate.subscribe(this.handleActivate.bind(this));
  }

  navigateToRoot() {
    this.routerService.router.navigate(AdministrationScreenService.screenName);
  }

  bootstrap() {
    this.screenService.create({
      name: AdministrationScreenService.screenName,
      path: '/admin',
      component: AdministrationScreen,
      onActivate: this.handleActivate.bind(this),
    });
  }

  private handleActivate() {
    if (!this.permissionsService.has(EAdminPermission.admin)) {
      this.appScreenService.navigateToRoot();
    }
  }
}
