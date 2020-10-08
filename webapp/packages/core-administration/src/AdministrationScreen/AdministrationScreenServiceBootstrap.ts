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
    this.permissionsService.onUpdate.subscribe(this.checkPermissions.bind(this));
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
      onDeactivate: this.handleDeactivate.bind(this),
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
      onDeactivate: this.handleDeactivate.bind(this),
    });
  }

  async load() {
    await this.serverConfigResource.load(null);

    if (this.administrationScreenService.isConfigurationMode
      && !this.screenService.isActive(AdministrationScreenService.setupName)) {
      this.administrationScreenService.navigateToRoot();
    }
  }

  private async handleDeactivate() {
    if (!this.administrationScreenService.isAdministrationRouteActive()) {
      this.administrationScreenService.activationEvent.execute(false);
    }

    if (this.administrationScreenService.isConfigurationMode
      && !this.screenService.isActive(AdministrationScreenService.setupName)) {
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
      this.administrationScreenService.isConfigurationMode
    );
  }

  private async handleActivate() {
    if (!await this.checkPermissions()) {
      return;
    }
    this.administrationScreenService.activationEvent.execute(true);

    if (this.administrationScreenService.activeItem) {
      await this.administrationItemService.activate(
        this.administrationScreenService.activeItem,
        this.administrationScreenService.activeItemSub,
        this.administrationScreenService.activeItemSubParam,
        this.administrationScreenService.isConfigurationMode
      );
    }
  }

  private async checkPermissions() {
    if (!await this.isAccessProvided()) {
      this.screenService.navigateToRoot();
      return false;
    }
    return true;
  }

  private async isAccessProvided() {
    await this.serverConfigResource.load(null);
    if (!await this.permissionsService.hasAsync(EAdminPermission.admin)
          && !this.administrationScreenService.isConfigurationMode) {
      return false;
    }

    if (!this.administrationScreenService.isConfigurationMode
        && this.screenService.isActive(AdministrationScreenService.setupName)) {
      return false;
    }

    return true;
  }
}
