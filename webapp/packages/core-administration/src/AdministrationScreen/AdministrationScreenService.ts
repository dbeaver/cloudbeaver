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
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService, RouterService } from '@cloudbeaver/core-routing';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { IRouteParams } from './IRouteParams';

const ADMINISTRATION_ITEMS_STATE = 'administration_items_state';

@injectable()
export class AdministrationScreenService {

  static screenName = 'administration'
  static itemRouteName = 'administration.item'
  static itemSubRouteName = 'administration.item.sub'
  static itemSubParamRouteName = 'administration.item.sub.param'

  static setupName = 'setup'
  static setupItemRouteName = 'setup.item'
  static setupItemSubRouteName = 'setup.item.sub'
  static setupItemSubParamRouteName = 'setup.item.sub.param'

  @observable itemState: Map<string, any>;

  @computed get activeItem(): string | null {
    if (!this.isAdministrationRouteActive()) {
      return null;
    }
    return this.routerService.params.item || this.administrationItemService.getDefaultItem(this.isConfigurationMode);
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

  get isConfigurationMode() {
    return !!this.serverConfigResource.data?.configurationMode;
  }
  readonly activationEvent: IExecutor<boolean>;

  constructor(
    private screenService: ScreenService,
    private routerService: RouterService,
    private administrationItemService: AdministrationItemService,
    private autoSaveService: LocalStorageSaveService,
    private serverConfigResource: ServerConfigResource
  ) {
    this.itemState = new Map();
    this.activationEvent = new Executor();

    this.autoSaveService.withAutoSave(this.itemState, ADMINISTRATION_ITEMS_STATE);
  }

  navigateToRoot() {
    if (this.isConfigurationMode) {
      this.routerService.router.navigate(AdministrationScreenService.setupName);
    } else {
      this.routerService.router.navigate(AdministrationScreenService.screenName);
    }
  }

  navigateTo(item: string, params?: IRouteParams) {
    if (!params) {
      this.navigateToItem(item);
    } else {
      this.navigateToItemSub(item, params.sub, params.param);
    }
  }

  navigateToItem(item: string) {
    if (this.isConfigurationMode) {
      this.routerService.router.navigate(AdministrationScreenService.setupItemRouteName, { item });
    } else {
      this.routerService.router.navigate(AdministrationScreenService.itemRouteName, { item });
    }
  }

  navigateToItemSub(item: string, sub: string, param?: string) {
    if (!param) {
      if (this.isConfigurationMode) {
        this.routerService.router.navigate(AdministrationScreenService.setupItemSubRouteName, { item, sub });
      } else {
        this.routerService.router.navigate(AdministrationScreenService.itemSubRouteName, { item, sub });
      }
      return;
    }
    if (this.isConfigurationMode) {
      this.routerService.router.navigate(AdministrationScreenService.setupItemSubParamRouteName, { item, sub, param });
    } else {
      this.routerService.router.navigate(AdministrationScreenService.itemSubParamRouteName, { item, sub, param });
    }
  }

  getItemState<T>(name: string): T | undefined
  getItemState<T>(name: string, defaultState: () => T): T
  getItemState<T>(name: string, defaultState?: () => T): T | undefined {
    if (!this.itemState.has(name) && defaultState) {
      this.itemState.set(name, defaultState());
    }

    return this.itemState.get(name);
  }

  clearItemsState() {
    this.itemState.clear();
  }

  isAdministrationRouteActive() {
    return this.screenService.isActive(AdministrationScreenService.screenName)
    || this.screenService.isActive(AdministrationScreenService.setupName);
  }
}
