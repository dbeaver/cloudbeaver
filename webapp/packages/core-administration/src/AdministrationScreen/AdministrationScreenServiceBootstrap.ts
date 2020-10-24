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
    this.permissionsService.onUpdate.subscribe(() => this.checkPermissions(this.screenService.routerService.state));
  }

  register(): void {
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

  async load(): Promise<void> {
    await this.serverConfigResource.load(null);

    if (this.administrationScreenService.isConfigurationMode
      && !this.screenService.isActive(this.screenService.routerService.route, AdministrationScreenService.setupName)) {
      this.administrationScreenService.navigateToRoot();
    }
  }

  private async handleDeactivate(state: RouterState, nextState: RouterState) {
    if (nextState && !this.administrationScreenService.isAdministrationRouteActive(nextState.name)) {
      await this.administrationScreenService.activationEvent.execute(false);
    }

    const toScreen = this.administrationScreenService.getScreen(nextState);
    const screen = this.administrationScreenService.getScreen(state);
    if (screen) {
      await this.administrationItemService.deActivate(
        screen,
        this.administrationScreenService.isConfigurationMode,
        screen.item !== toScreen?.item
      );
    }

    if (this.administrationScreenService.isConfigurationMode
      && !this.screenService.isActive(state.name, AdministrationScreenService.setupName)) {
      this.administrationScreenService.navigateToRoot();
    }
  }

  private async handleCanActivate(toState: RouterState) {
    if (!toState.params?.item) {
      return false;
    }

    const fromScreen = this.administrationScreenService.getScreen(this.screenService.routerService.state);
    const screen = this.administrationScreenService.getScreen(toState);
    if (!screen) {
      return false;
    }

    return this.administrationItemService.canActivate(
      screen,
      this.administrationScreenService.isConfigurationMode,
      screen.item !== fromScreen?.item
    );
  }

  private async handleActivate(state: RouterState, prevState?: RouterState) {
    if (!await this.checkPermissions(state)) {
      return;
    }
    await this.administrationScreenService.activationEvent.execute(true);

    const screen = this.administrationScreenService.getScreen(state);
    const fromScreen = this.administrationScreenService.getScreen(prevState);
    if (screen) {
      await this.administrationItemService.activate(
        screen,
        this.administrationScreenService.isConfigurationMode,
        screen.item !== fromScreen?.item
      );
    }
  }

  private async checkPermissions(state: RouterState) {
    if (!await this.isAccessProvided(state)) {
      this.screenService.navigateToRoot();
      return false;
    }
    return true;
  }

  private async isAccessProvided(state: RouterState) {
    await this.serverConfigResource.load(null);
    if (!await this.permissionsService.hasAsync(EAdminPermission.admin)
          && !this.administrationScreenService.isConfigurationMode) {
      return false;
    }

    if (!this.administrationScreenService.isConfigurationMode
        && this.screenService.isActive(state.name, AdministrationScreenService.setupName)) {
      return false;
    }

    return true;
  }
}
