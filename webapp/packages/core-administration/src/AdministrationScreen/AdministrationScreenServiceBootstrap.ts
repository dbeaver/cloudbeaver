/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { PermissionsService, ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService, RouterState } from '@cloudbeaver/core-routing';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreen } from './AdministrationScreen';
import { AdministrationScreenService } from './AdministrationScreenService';
import { ConfigurationWizardScreen } from './ConfigurationWizard/ConfigurationWizardScreen';

@injectable()
export class AdministrationScreenServiceBootstrap extends Bootstrap {

  constructor(
    private screenService: ScreenService,
    private permissionsService: PermissionsService,
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private serverConfigResource: ServerConfigResource
  ) {
    super();
    this.permissionsService.onUpdate.subscribe(this.handleActivate.bind(this));
  }

  register() {
    this.screenService.create({
      name: AdministrationScreenService.screenName,
      routes: [
        {
          name: AdministrationScreenService.screenName,
          path: '/admin',
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.itemRouteName,
          path: '/:item',
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.itemSubRouteName,
          path: '/:sub',
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.itemSubParamRouteName,
          path: '/:param',
          canActivate: () => this.handleCanActivate.bind(this),
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
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.setupItemRouteName,
          path: '/:item',
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.setupItemSubRouteName,
          path: '/:sub',
          canActivate: () => this.handleCanActivate.bind(this),
        },
        {
          name: AdministrationScreenService.setupItemSubParamRouteName,
          path: '/:param',
          canActivate: () => this.handleCanActivate.bind(this),
        },
      ],
      component: ConfigurationWizardScreen,
      onActivate: this.handleActivate.bind(this),
    });
  }

  async load() {
    const config = await this.serverConfigResource.load(null);

    if (config?.configurationMode) {
      this.administrationScreenService.configurationWizard = true;
      this.administrationScreenService.navigateToRoot();
    }
  }

  private async handleCanActivate(toState: RouterState, fromState: RouterState) {
    if (!toState.params?.item) {
      return false;
    }

    return this.administrationItemService.canActivate(
      toState.params?.item,
      toState.params?.sub,
      toState.params?.param,
      this.administrationScreenService.configurationWizard
    );
  }

  private async handleActivate() {
    if (!this.permissionsService.has(EAdminPermission.admin)) {
      this.screenService.navigateToRoot();
      return;
    }

    if (this.administrationScreenService.activeItem) {
      await this.administrationItemService.activate(
        this.administrationScreenService.activeItem,
        this.administrationScreenService.activeItemSub,
        this.administrationScreenService.activeItemSubParam,
        this.administrationScreenService.configurationWizard
      );
    }
  }
}
