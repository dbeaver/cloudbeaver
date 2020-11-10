/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { IExecutor, Executor } from '@cloudbeaver/core-executor';
import { PermissionsResource, PermissionsService, ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService, RouterState } from '@cloudbeaver/core-routing';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute';
import { IRouteParams } from '../AdministrationItem/IRouteParams';
import { EAdminPermission } from '../EAdminPermission';

const ADMINISTRATION_ITEMS_STATE = 'administration_items_state';
const ADMINISTRATION_INFO = 'administration_mode';

interface IAdministrationScreenInfo {
  mode: boolean;
}

@injectable()
export class AdministrationScreenService {
  static screenName = 'administration';
  static itemRouteName = 'administration.item';
  static itemSubRouteName = 'administration.item.sub';
  static itemSubParamRouteName = 'administration.item.sub.param';

  static setupName = 'setup';
  static setupItemRouteName = 'setup.item';
  static setupItemSubRouteName = 'setup.item.sub';
  static setupItemSubParamRouteName = 'setup.item.sub.param';

  @observable info: IAdministrationScreenInfo;
  @observable itemState: Map<string, any>;

  @computed get activeScreen(): IAdministrationItemRoute | null {
    return this.getScreen(this.screenService.routerService.state);
  }

  get isConfigurationMode(): boolean {
    return !!this.serverConfigResource.data?.configurationMode;
  }

  readonly ensurePermissions: IExecutor<void>;
  readonly activationEvent: IExecutor<boolean>;

  constructor(
    private permissionsResource: PermissionsResource,
    private permissionsService: PermissionsService,
    private screenService: ScreenService,
    private administrationItemService: AdministrationItemService,
    private autoSaveService: LocalStorageSaveService,
    private serverConfigResource: ServerConfigResource
  ) {
    this.info = {
      mode: false,
    };
    this.itemState = new Map();
    this.activationEvent = new Executor();
    this.ensurePermissions = new Executor();

    this.autoSaveService.withAutoSave(this.itemState, ADMINISTRATION_ITEMS_STATE);
    this.autoSaveService.withAutoSave(this.info, ADMINISTRATION_INFO);
    this.permissionsResource.onDataUpdate.addHandler(() => {
      this.checkPermissions(this.screenService.routerService.state);
    });
  }

  getScreen(state?: RouterState): IAdministrationItemRoute | null {
    if (!state || !this.isAdministrationRouteActive(state.name)) {
      return null;
    }

    return this.administrationItemService.getAdministrationItemRoute(state, this.isConfigurationMode);
  }

  navigateToRoot(): void {
    if (this.isConfigurationMode) {
      this.screenService.navigate(AdministrationScreenService.setupName);
    } else {
      this.screenService.navigate(AdministrationScreenService.screenName);
    }
  }

  navigateTo(item: string, params?: IRouteParams): void {
    if (!params) {
      this.navigateToItem(item);
    } else {
      this.navigateToItemSub(item, params.sub, params.param);
    }
  }

  navigateToItem(item: string): void {
    if (this.isConfigurationMode) {
      this.screenService.navigate(AdministrationScreenService.setupItemRouteName, item);
    } else {
      this.screenService.navigate(AdministrationScreenService.itemRouteName, item);
    }
  }

  navigateToItemSub(item: string, sub: string, param?: string): void {
    if (!param) {
      if (this.isConfigurationMode) {
        this.screenService.navigate(AdministrationScreenService.setupItemSubRouteName, item, sub);
      } else {
        this.screenService.navigate(AdministrationScreenService.itemSubRouteName, item, sub);
      }
      return;
    }
    if (this.isConfigurationMode) {
      this.screenService.navigate(AdministrationScreenService.setupItemSubParamRouteName, item, sub, param);
    } else {
      this.screenService.navigate(AdministrationScreenService.itemSubParamRouteName, item, sub, param);
    }
  }

  getItemState<T>(name: string): T | undefined
  getItemState<T>(name: string, defaultState: () => T, update?: boolean, validate?: (state: T) => boolean): T
  getItemState<T>(
    name: string, defaultState?: () => T,
    update?: boolean,
    validate?: (state: T) => boolean
  ): T | undefined {
    if (!this.serverConfigResource.isLoaded()) {
      throw new Error('Administration screen getItemState can be used only after server configuration loaded');
    }
    if (this.info.mode !== this.isConfigurationMode) {
      this.clearItemsState();
      this.info.mode = this.isConfigurationMode;
    }

    if (defaultState) {
      if (!this.itemState.has(name) || update) {
        this.itemState.set(name, defaultState());
      } else if (validate) {
        const state = this.itemState.get(name)!;

        if (!validate(state)) {
          this.itemState.set(name, defaultState());
        }
      }
    }

    return this.itemState.get(name);
  }

  clearItemsState(): void {
    this.itemState.clear();
  }

  isAdministrationRouteActive(routeName: string): boolean {
    return this.screenService.isActive(routeName, AdministrationScreenService.screenName)
    || this.screenService.isActive(routeName, AdministrationScreenService.setupName);
  }

  async handleDeactivate(state: RouterState, nextState: RouterState): Promise<void> {
    if (nextState && !this.isAdministrationRouteActive(nextState.name)) {
      await this.activationEvent.execute(false);
    }

    const toScreen = this.getScreen(nextState);
    const screen = this.getScreen(state);
    if (screen) {
      await this.administrationItemService.deActivate(
        screen,
        this.isConfigurationMode,
        screen.sub !== toScreen?.sub
      );
    }

    if (this.isConfigurationMode
      && !this.screenService.isActive(nextState.name, AdministrationScreenService.setupName)) {
      this.navigateToRoot();
    }
  }

  async handleCanActivate(toState: RouterState): Promise<boolean> {
    if (!toState.params?.item) {
      return false;
    }

    const fromScreen = this.getScreen(this.screenService.routerService.state);
    const screen = this.getScreen(toState);
    if (!screen) {
      return false;
    }

    return this.administrationItemService.canActivate(
      screen,
      this.isConfigurationMode,
      screen.item !== fromScreen?.item
    );
  }

  async handleActivate(state: RouterState, prevState?: RouterState): Promise<void> {
    if (!await this.checkPermissions(state)) {
      return;
    }

    await this.activationEvent.execute(true);

    const screen = this.getScreen(state);
    const fromScreen = this.getScreen(prevState);
    if (screen) {
      await this.administrationItemService.activate(
        screen,
        this.isConfigurationMode,
        screen.item !== fromScreen?.item
      );
    }
  }

  private async checkPermissions(state: RouterState) {
    if (!this.isAdministrationRouteActive(state.name)) {
      return;
    }

    if (!await this.isAccessProvided(state)) {
      this.screenService.navigateToRoot();
      return false;
    }
    return true;
  }

  private async isAccessProvided(state: RouterState) {
    await this.serverConfigResource.load();

    if (this.isConfigurationMode) {
      return true;
    }

    if (this.screenService.isActive(state.name, AdministrationScreenService.setupName)) {
      this.navigateToRoot();
      return;
    }

    await this.ensurePermissions.execute();

    if (!await this.permissionsService.hasAsync(EAdminPermission.admin)) {
      return false;
    }

    return true;
  }
}
