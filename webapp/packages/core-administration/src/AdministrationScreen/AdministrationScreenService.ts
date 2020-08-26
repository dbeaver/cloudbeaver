/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService, RouterService } from '@cloudbeaver/core-routing';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreen } from './AdministrationScreen';
import { ConfigurationWizardScreen } from './ConfigurationWizardScreen';

@injectable()
export class AdministrationScreenService extends Bootstrap {

  static screenName = 'administration'
  static itemRouteName = 'administration.item'
  static itemSubRouteName = 'administration.item.sub'
  static itemSubParamRouteName = 'administration.item.sub.param'

  static setupName = 'setup'
  static setupItemRouteName = 'setup.item'
  static setupItemSubRouteName = 'setup.item.sub'
  static setupItemSubParamRouteName = 'setup.item.sub.param'

  @observable configurationWizard = false;

  @computed get activeItem(): string | null {
    if (!this.isAdministrationRouteActive()) {
      return null;
    }
    return this.routerService.params.item || this.administrationItemService.getDefaultItem(this.configurationWizard);
  }

  @computed get activeItemSub(): string | null {
    if (!this.isAdministrationRouteActive()) {
      return null;
    }
    return this.routerService.params.sub || null;
  }

  @computed get activeItemSubParam(): string | null {
    if (!this.isAdministrationRouteActive()) {
      return null;
    }
    return this.routerService.params.param || null;
  }

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
    private permissionsService: PermissionsService,
    private administrationItemService: AdministrationItemService
  ) {
    super();
    this.permissionsService.onUpdate.subscribe(this.handleActivate.bind(this));
  }

  navigateToRoot() {
    if (this.configurationWizard) {
      this.routerService.router.navigate(AdministrationScreenService.setupName);
    } else {
      this.routerService.router.navigate(AdministrationScreenService.screenName);
    }
  }

  navigateToItem(item: string) {
    if (this.configurationWizard) {
      this.routerService.router.navigate(AdministrationScreenService.setupItemRouteName, { item });
    } else {
      this.routerService.router.navigate(AdministrationScreenService.itemRouteName, { item });
    }
  }

  navigateToItemSub(item: string, sub: string, param?: string) {
    if (!param) {
      if (this.configurationWizard) {
        this.routerService.router.navigate(AdministrationScreenService.setupItemSubRouteName, { item, sub });
      } else {
        this.routerService.router.navigate(AdministrationScreenService.itemSubRouteName, { item, sub });
      }
      return;
    }
    if (this.configurationWizard) {
      this.routerService.router.navigate(AdministrationScreenService.setupItemSubParamRouteName, { item, sub, param });
    } else {
      this.routerService.router.navigate(AdministrationScreenService.itemSubParamRouteName, { item, sub, param });
    }
  }

  register() {
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
        {
          name: AdministrationScreenService.itemSubRouteName,
          path: '/:sub',
        },
        {
          name: AdministrationScreenService.itemSubParamRouteName,
          path: '/:param',
        },
      ],
      component: AdministrationScreen,
      onActivate: this.handleActivate.bind(this),
    });

    this.screenService.create({
      name: AdministrationScreenService.setupName,
      routes: [
        {
          name: AdministrationScreenService.setupName,
          path: '/setup',
        },
        {
          name: AdministrationScreenService.setupItemRouteName,
          path: '/:item',
        },
        {
          name: AdministrationScreenService.setupItemSubRouteName,
          path: '/:sub',
        },
        {
          name: AdministrationScreenService.setupItemSubParamRouteName,
          path: '/:param',
        },
      ],
      component: ConfigurationWizardScreen,
      onActivate: this.handleActivate.bind(this),
    });
  }

  load(): void | Promise<void> { }

  private async handleActivate() {
    if (!this.permissionsService.has(EAdminPermission.admin)) {
      this.screenService.navigateToRoot();
      return;
    }

    // FIXME: for development purposes only, must be removed
    if (this.screenService.isActive(AdministrationScreenService.setupName)) {
      this.configurationWizard = true;
    }

    if (this.activeItem) {
      await this.administrationItemService.activate(
        this.activeItem,
        this.activeItemSub,
        this.activeItemSubParam,
        this.configurationWizard
      );
    }
  }

  private isAdministrationRouteActive() {
    return this.screenService.isActive(AdministrationScreenService.screenName)
    || this.screenService.isActive(AdministrationScreenService.setupName);
  }
}
