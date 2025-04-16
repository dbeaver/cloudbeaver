/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { EAdminPermission, PermissionsService, ServerConfigResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { type RouterState, ScreenService } from '@cloudbeaver/core-routing';
import { StorageService } from '@cloudbeaver/core-storage';
import { type DefaultValueGetter, GlobalConstants, MetadataMap, schema } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService.js';
import type { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute.js';
import type { IRouteParams } from '../AdministrationItem/IRouteParams.js';
import { ADMINISTRATION_SCREEN_STATE_SCHEMA, type IAdministrationScreenInfo } from './IAdministrationScreenState.js';

const ADMINISTRATION_INFO = 'administration_info';

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

  readonly info: IAdministrationScreenInfo;
  readonly itemState: MetadataMap<string, any>;

  get isAdministrationPageActive(): boolean {
    return this.isAdministrationRouteActive(this.screenService.routerService.state.name);
  }

  get activeScreen(): IAdministrationItemRoute | null {
    return this.getScreen(this.screenService.routerService.state);
  }

  get isConfigurationMode(): boolean {
    return this.serverConfigResource.configurationMode;
  }

  get publicDisabled(): boolean {
    return this.permissionsService.publicDisabled;
  }

  readonly ensurePermissions: IExecutor;
  readonly activationEvent: IExecutor<boolean>;

  private itemsStateSync: Array<[string, any]>;

  constructor(
    private readonly permissionsResource: SessionPermissionsResource,
    private readonly permissionsService: PermissionsService,
    private readonly screenService: ScreenService,
    private readonly administrationItemService: AdministrationItemService,
    private readonly storageService: StorageService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
  ) {
    this.info = getDefaultAdministrationScreenInfo();
    this.itemState = new MetadataMap();
    this.activationEvent = new Executor();
    this.ensurePermissions = new Executor();
    this.itemsStateSync = [];

    makeObservable<this, 'itemsStateSync'>(this, {
      info: observable,
      itemsStateSync: observable,
      activeScreen: computed,
    });

    this.storageService.registerSettings(
      ADMINISTRATION_INFO,
      this.info,
      getDefaultAdministrationScreenInfo,
      data => {
        const parsed = ADMINISTRATION_SCREEN_STATE_SCHEMA.safeParse(data);

        if (
          !parsed.success ||
          parsed.data.workspaceId !== this.serverConfigResource.workspaceId ||
          parsed.data.configurationMode !== this.isConfigurationMode ||
          parsed.data.serverVersion !== this.serverConfigResource.serverVersion ||
          parsed.data.version !== GlobalConstants.version
        ) {
          return {
            workspaceId: this.serverConfigResource.workspaceId,
            configurationMode: this.isConfigurationMode,
            serverVersion: this.serverConfigResource.serverVersion,
            version: GlobalConstants.version || '',
            itemsState: observable([], { deep: true }),
          };
        }

        return { ...parsed.data, itemsState: observable(parsed.data.itemsState, { deep: true }) };
      },
      () => {
        this.itemState.sync(this.itemsStateSync);
      },
    );
    this.permissionsResource.onDataUpdate.addPostHandler(() => {
      this.checkPermissions(this.screenService.routerService.state);
    });

    this.screenService.routeChange.addHandler(this.onRouteChange.bind(this));
  }

  private async onRouteChange() {
    // this is need for this.isConfigurationMode
    await this.serverConfigResource.load();

    const uniqueItems = this.administrationItemService.getUniqueItems(this.isConfigurationMode);
    const item = uniqueItems.find(i => i.name === this.activeScreen?.item);

    if (!this.isAdministrationPageActive) {
      return;
    }

    if (!this.activeScreen || !item) {
      this.navigateToRoot();
      return;
    }

    const loaders = [item]
      .map(loader => loader?.getLoader?.())
      .filter(isNotNullDefined)
      .flat();

    for (const loader of loaders) {
      if (loader.isError()) {
        continue;
      }

      if (!loader.isLoaded() || loader.isOutdated?.() === true) {
        try {
          await loader.load();
        } catch {}
      }
    }

    const loadedItem = this.administrationItemService.getItem(this.activeScreen.item, this.isConfigurationMode);

    if (!loadedItem) {
      this.navigateToRoot();
    }
  }

  getRouteName(item?: string, sub?: string, param?: string) {
    if (this.isConfigurationMode) {
      if (item) {
        if (sub) {
          if (param) {
            return AdministrationScreenService.setupItemSubParamRouteName;
          }
          return AdministrationScreenService.setupItemSubRouteName;
        }
        return AdministrationScreenService.setupItemRouteName;
      }
      return AdministrationScreenService.setupName;
    } else {
      if (item) {
        if (sub) {
          if (param) {
            return AdministrationScreenService.itemSubParamRouteName;
          }
          return AdministrationScreenService.itemSubRouteName;
        }
        return AdministrationScreenService.itemRouteName;
      }
      return AdministrationScreenService.screenName;
    }
  }

  getScreen(state?: RouterState): IAdministrationItemRoute | null {
    if (!state || !this.isAdministrationRouteActive(state.name)) {
      return null;
    }

    return this.administrationItemService.getAdministrationItemRoute(state, this.isConfigurationMode);
  }

  navigateToRoot(): void {
    this.screenService.navigateToScreen(this.getRouteName());
  }

  navigateTo(item: string, params?: IRouteParams): void {
    if (!params) {
      this.navigateToItem(item);
    } else {
      this.navigateToItemSub(item, params.sub, params.param);
    }
  }

  navigateToItem(itemName: string): void {
    const item = this.administrationItemService.getItem(itemName, this.isConfigurationMode);

    this.screenService.navigateToScreen(
      this.getRouteName(itemName, item?.defaultSub, item?.defaultParam),
      itemName,
      item?.defaultSub,
      item?.defaultParam,
    );
  }

  navigateToItemSub(item: string, sub: string, param?: string): void {
    this.screenService.navigateToScreen(this.getRouteName(item, sub, param), item, sub, param);
  }

  getItemState<T>(name: string): T | undefined;
  getItemState<T>(name: string, defaultState: DefaultValueGetter<string, T>, schema?: schema.AnyZodObject): T;
  getItemState<T>(name: string, defaultState?: DefaultValueGetter<string, T>, schema?: schema.AnyZodObject): T | undefined {
    if (!this.serverConfigResource.isLoaded()) {
      throw new Error('Administration screen getItemState can be used only after server configuration loaded');
    }

    return this.itemState.get(name, defaultState, schema);
  }

  clearItemsState(): void {
    this.itemState.clear();
  }

  isAdministrationRouteActive(routeName: string): boolean {
    return (
      this.screenService.isActive(routeName, AdministrationScreenService.screenName) ||
      this.screenService.isActive(routeName, AdministrationScreenService.setupName)
    );
  }

  async handleDeactivate(state: RouterState, nextState: RouterState): Promise<void> {
    if (nextState && !this.isAdministrationRouteActive(nextState.name)) {
      await this.activationEvent.execute(false);
    }

    const toScreen = this.getScreen(nextState);
    const screen = this.getScreen(state);

    if (screen) {
      await this.administrationItemService.deActivate(screen, this.isConfigurationMode, screen.item !== toScreen?.item, toScreen === null);
    }

    if (this.isConfigurationMode && !this.screenService.isActive(nextState.name, AdministrationScreenService.setupName)) {
      this.navigateToRoot();
    }
  }

  async handleCanDeActivate(fromState: RouterState, toState: RouterState): Promise<boolean> {
    if (!fromState.params['item']) {
      return true;
    }

    const toScreen = this.getScreen(toState);
    const screen = this.getScreen(fromState);

    if (!screen) {
      return true;
    }

    return this.administrationItemService.canDeActivate(screen, toScreen, this.isConfigurationMode, screen.item !== toScreen?.item);
  }

  async handleCanActivate(toState: RouterState, fromState: RouterState): Promise<boolean> {
    if (!toState.params['item']) {
      return false;
    }

    const fromScreen = this.getScreen(fromState);
    const screen = this.getScreen(toState);
    if (!screen) {
      return false;
    }

    return this.administrationItemService.canActivate(screen, this.isConfigurationMode, screen.item !== fromScreen?.item);
  }

  async handleActivate(state: RouterState, prevState?: RouterState): Promise<void> {
    if (!(await this.checkPermissions(state))) {
      return;
    }

    await this.activationEvent.execute(true);

    const screen = this.getScreen(state);
    const fromScreen = this.getScreen(prevState);
    if (screen) {
      await this.administrationItemService.activate(screen, this.isConfigurationMode, screen.item !== fromScreen?.item, fromScreen === null);
    }
  }

  private async checkPermissions(state: RouterState): Promise<boolean> {
    if (!this.isAdministrationRouteActive(state.name)) {
      return false;
    }

    const accessProvided = await this.isAccessProvided(state);

    if (!accessProvided) {
      this.screenService.navigateToRoot();

      this.notificationService.logInfo({ title: 'root_permission_no_permission', uuid: 'no_permission' });
      return false;
    }
    return true;
  }

  private async isAccessProvided(state: RouterState): Promise<boolean> {
    await this.serverConfigResource.load();
    await this.permissionsResource.load();

    if (this.isConfigurationMode) {
      return true;
    }

    if (this.screenService.isActive(state.name, AdministrationScreenService.setupName)) {
      return false;
    }

    await this.ensurePermissions.execute();

    const administrator = await this.permissionsService.hasAsync(EAdminPermission.admin);

    if (!administrator) {
      return false;
    }

    return true;
  }
}

function getDefaultAdministrationScreenInfo(): IAdministrationScreenInfo {
  return {
    workspaceId: '',
    version: GlobalConstants.version || '',
    serverVersion: '',
    configurationMode: false,
    itemsState: [],
  };
}
