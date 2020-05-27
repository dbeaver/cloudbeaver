/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { ScreenService, RouterService, AppScreenService } from '@dbeaver/core/app';
import { injectable, Bootstrap } from '@dbeaver/core/di';
import { PermissionsService } from '@dbeaver/core/root';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreen } from './AdministrationScreen';

@injectable()
export class AdministrationScreenService extends Bootstrap {

  static screenName = 'administration'
  static itemRouteName = 'administration.item'

  @computed get activeItem(): string | null {
    if (!this.screenService.isActive(AdministrationScreenService.screenName)) {
      return null;
    }
    return this.routerService.params.item || null;
  }

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
    private permissionsService: PermissionsService,
    private appScreenService: AppScreenService,
    private administrationItemService: AdministrationItemService
  ) {
    super();
    this.permissionsService.onUpdate.subscribe(this.handleActivate.bind(this));
  }

  navigateToRoot() {
    this.routerService.router.navigate(AdministrationScreenService.screenName);
  }

  navigateToItem(item: string) {
    this.routerService.router.navigate(AdministrationScreenService.itemRouteName, { item });
  }

  bootstrap() {
    this.screenService.create({
      name: AdministrationScreenService.screenName,
      routes: [
        {
          name: AdministrationScreenService.screenName,
          path: '/admin',
        },
        {
          name: AdministrationScreenService.itemRouteName,
          path: '/:item',
        },
      ],
      component: AdministrationScreen,
      onActivate: this.handleActivate.bind(this),
    });
  }

  private async handleActivate() {
    if (!this.permissionsService.has(EAdminPermission.admin)) {
      this.appScreenService.navigateToRoot();
      return;
    }

    if (this.activeItem) {
      await this.administrationItemService.activate(this.activeItem);
    }
  }
}
