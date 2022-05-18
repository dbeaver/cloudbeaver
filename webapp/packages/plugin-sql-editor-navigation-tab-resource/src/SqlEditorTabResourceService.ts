/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ITab, NavigationTabsService, NavTreeResource, NodeManagerUtils } from '@cloudbeaver/core-app';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { debounce, throttleAsync } from '@cloudbeaver/core-utils';
import { NavResourceNodeService, ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { IQueryChangeData, ISqlEditorTabState, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';
import { isSQLEditorTab, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

const SYNC_DELAY = 5 * 1000;
const VALUE_SYNC_DELAY = 0.5 * 1000;
const RESOURCE_TAB_STATE = 'sql_editor_resource_tab_state';

interface IResourceTabData {
  nodeId: string;
  parents: string[];
}

type ResourceTabState = Map<string, IResourceTabData>;

@injectable()
export class SqlEditorTabResourceService {
  state: ResourceTabState;

  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly notificationService: NotificationService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly windowEventsService: WindowEventsService,
    private readonly localStorageSaveService: LocalStorageSaveService,
    private readonly userInfoResource: UserInfoResource
  ) {
    this.state = new Map();

    this.onNodeDeleteHandler = this.onNodeDeleteHandler.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
    this.onTabCloseHandler = this.onTabCloseHandler.bind(this);
    this.onFocusChangeHandler = this.onFocusChangeHandler.bind(this);
    this.onTabResourceValueChangeHandler = this.onTabResourceValueChangeHandler.bind(this);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this.updateTabQuery = throttleAsync(this.updateTabQuery, SYNC_DELAY);
    this.updateResource = debounce(this.updateResource, VALUE_SYNC_DELAY);

    makeObservable(this, {
      state: observable,
    });

    this.localStorageSaveService.withAutoSave(this.state, RESOURCE_TAB_STATE);
  }

  start() {
    this.navTreeResource.onItemDelete.addHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.addHandler(this.onTabSelectHandler);
    this.navigationTabsService.onTabClose.addHandler(this.onTabCloseHandler);
    this.windowEventsService.onFocusChange.addHandler(this.onFocusChangeHandler);
    this.sqlEditorService.onQueryChange.addHandler(this.onTabResourceValueChangeHandler);
  }

  stop() {
    this.navTreeResource.onItemDelete.removeHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.removeHandler(this.onTabSelectHandler);
    this.navigationTabsService.onTabClose.removeHandler(this.onTabCloseHandler);
    this.windowEventsService.onFocusChange.removeHandler(this.onFocusChangeHandler);
    this.sqlEditorService.onQueryChange.removeHandler(this.onTabResourceValueChangeHandler);
  }

  linkTab(tabId: string, nodeId: string) {
    const parents = NodeManagerUtils.parentsFromPath(nodeId);

    this.state.set(tabId, {
      nodeId,
      parents,
    });
  }

  unlinkTab(tabId: string, closeTab = false) {
    const state = this.state.get(tabId);

    if (state) {
      this.state.delete(tabId);
      if (closeTab) {
        this.closeTab(tabId);
      }
    }
  }

  getResourceTab(nodeId: string) {
    for (const [tabId, data] of this.state) {
      if (data.nodeId === nodeId) {
        return tabId;
      }
    }

    return null;
  }

  private async onTabResourceValueChangeHandler(data: IQueryChangeData) {
    if (!this.navigationTabsService.currentTab) {
      return;
    }

    const tab = this.getTab(this.navigationTabsService.currentTab.id);
    if (tab && data.prevQuery !== data.query) {
      await this.updateResource(tab, data.query);
    }
  }

  private async onFocusChangeHandler(focused: boolean) {
    if (focused) {
      await this.syncCurrentTab();
    }
  }

  private async onTabSelectHandler(tab: ITab) {
    if (isSQLEditorTab(tab)) {
      await this.updateTabQuery(tab);
    }
  }

  private onTabCloseHandler(tab: ITab | undefined) {
    if (tab && this.state.has(tab.id)) {
      this.unlinkTab(tab.id);
    }
  }

  private onNodeDeleteHandler(keyObj: ResourceKey<string>) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    ResourceKeyUtils.forEach(keyObj, key => {
      const tabId = this.getResourceTab(key);
      if (tabId) {
        this.closeTab(tabId);
      }
    });
  }

  private getTab(tabId: string) {
    return this.sqlEditorTabService.sqlEditorTabs.find(tab => tab.id === tabId);
  }

  private closeTab(tabId: string) {
    this.navigationTabsService.closeTab(tabId);
  }

  private async syncCurrentTab() {
    const tab = this.getTab(this.navigationTabsService.currentTabId);

    if (tab) {
      await this.updateTabQuery(tab);
    }
  }

  private handleNotFound(tab: ITab<ISqlEditorTabState>) {
    this.notificationService.logInfo({
      title: 'plugin_resource_manager_script_not_found_title',
      message: tab.handlerState.name,
      persistent: true,
    });

    this.unlinkTab(tab.id);
  }

  private async updateResource(tab: ITab<ISqlEditorTabState>, value: string) {
    const state = this.state.get(tab.id);

    if (!this.resourceManagerService.enabled || !state || this.userInfoResource.getId() !== tab.userId) {
      return;
    }

    try {
      await this.navResourceNodeService.write(state.nodeId, value);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_update_script_error');
    }
  }

  private async updateTabQuery(tab: ITab<ISqlEditorTabState>) {
    const state = this.state.get(tab.id);

    if (!this.resourceManagerService.enabled || !state || this.userInfoResource.getId() !== tab.userId) {
      return;
    }

    try {
      const found = await this.navTreeResource.preloadNodeParents(state.parents, state.nodeId);

      if (!found) {
        this.handleNotFound(tab);
        return;
      }

      const query = await this.navResourceNodeService.read(state.nodeId);
      this.sqlEditorService.setQuery(query, tab.handlerState);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_sync_script_error');
    }
  }
}