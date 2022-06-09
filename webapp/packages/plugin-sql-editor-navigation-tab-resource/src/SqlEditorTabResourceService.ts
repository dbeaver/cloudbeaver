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
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { debounce, throttle } from '@cloudbeaver/core-utils';
import { NavResourceNodeService, ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { IQueryChangeData, ISqlEditorTabState, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

const SYNC_DELAY = 5 * 1000;
const VALUE_SYNC_DELAY = 1 * 1000;
const RESOURCE_TAB_STATE = 'sql_editor_resource_tab_state';

interface IResourceTabData {
  nodeId: string;
  parents: string[];
}

type ResourceTabState = Map<string, IResourceTabData>;

@injectable()
export class SqlEditorTabResourceService {
  readonly state: ResourceTabState;

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
    private readonly userInfoResource: UserInfoResource,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.state = new Map();

    this.onNodeDeleteHandler = this.onNodeDeleteHandler.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
    this.onTabCloseHandler = this.onTabCloseHandler.bind(this);
    this.canCloseTabHandler = this.canCloseTabHandler.bind(this);
    this.onFocusChangeHandler = this.onFocusChangeHandler.bind(this);
    this.onTabResourceValueChangeHandler = this.onTabResourceValueChangeHandler.bind(this);

    this.updateResource = this.updateResource.bind(this);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this.updateTabQuery = throttle(this.updateTabQuery, SYNC_DELAY, false);
    this.debouncedUpdateResource = debounce(this.debouncedUpdateResource, VALUE_SYNC_DELAY);

    makeObservable(this, {
      state: observable,
    });

    this.localStorageSaveService.withAutoSave(this.state, RESOURCE_TAB_STATE);
  }

  start() {
    this.navTreeResource.onItemDelete.addHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.addHandler(this.onTabSelectHandler);
    this.navigationTabsService.onTabClose.addHandler(this.onTabCloseHandler);
    this.sqlEditorTabService.onCanClose.addHandler(this.canCloseTabHandler);
    this.windowEventsService.onFocusChange.addHandler(this.onFocusChangeHandler);
    this.sqlEditorService.onQueryChange.addHandler(this.onTabResourceValueChangeHandler);
  }

  stop() {
    this.navTreeResource.onItemDelete.removeHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.removeHandler(this.onTabSelectHandler);
    this.navigationTabsService.onTabClose.removeHandler(this.onTabCloseHandler);
    this.sqlEditorTabService.onCanClose.removeHandler(this.canCloseTabHandler);
    this.windowEventsService.onFocusChange.removeHandler(this.onFocusChangeHandler);
    this.sqlEditorService.onQueryChange.removeHandler(this.onTabResourceValueChangeHandler);
  }

  linkTab(tabId: string, nodeId: string) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

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
        this.navigationTabsService.closeTab(tabId);
      }
    }
  }

  getResourceTab(nodeId: string) {
    if (!this.resourceManagerService.enabled) {
      return null;
    }

    for (const [tabId, data] of this.state) {
      if (data.nodeId === nodeId) {
        return tabId;
      }
    }

    return null;
  }

  private async onTabResourceValueChangeHandler(data: IQueryChangeData) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    const tabId = this.navigationTabsService.currentTab?.id;
    if (!tabId) {
      return;
    }

    const tab = this.getTab(tabId);
    if (tab && data.prevQuery !== data.query) {
      await this.debouncedUpdateResource(tab, data.query);
    }
  }

  private async onFocusChangeHandler(focused: boolean) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    if (focused) {
      await this.syncCurrentTab();
    }
  }

  private async onTabSelectHandler(tab: ITab) {
    await this.updateTabQuery(tab);
  }

  private async canCloseTabHandler(
    tab: ITab<ISqlEditorTabState>,
    contexts: IExecutionContextProvider<any>
  ) {
    try {
      await this.updateResource(tab, tab.handlerState.query);
    } catch {
      const result = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'plugin_resource_manager_save_script_error_confirmation_title',
        message: 'plugin_resource_manager_save_script_error_confirmation_message',
        subTitle: tab.handlerState.name,
        confirmActionText: 'ui_close',
      });

      if (result === DialogueStateResult.Rejected) {
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }

  private async onTabCloseHandler(tab: ITab | undefined) {
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
        this.unlinkTab(tabId, true);
      }
    });
  }

  private getTab(tabId: string) {
    return this.sqlEditorTabService.sqlEditorTabs.find(tab => tab.id === tabId);
  }

  private async syncCurrentTab() {
    const tab = this.getTab(this.navigationTabsService.currentTabId);

    if (tab) {
      await this.updateTabQuery(tab);
    }
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
      throw (exception);
    }
  }

  private async debouncedUpdateResource(tab: ITab<ISqlEditorTabState>, value: string) {
    await this.updateResource(tab, value);
  }

  private async updateTabQuery(tab: ITab<ISqlEditorTabState>) {
    const state = this.state.get(tab.id);

    if (!this.resourceManagerService.enabled || !state || this.userInfoResource.getId() !== tab.userId) {
      return;
    }

    try {
      const found = await this.navTreeResource.preloadNodeParents(state.parents, state.nodeId);

      if (!found) {
        this.notificationService.logInfo({
          title: 'plugin_resource_manager_script_not_found_title',
          message: tab.handlerState.name,
          persistent: true,
        });

        this.unlinkTab(tab.id);
        return;
      }

      const query = await this.navResourceNodeService.read(state.nodeId);
      this.sqlEditorService.setQuery(query, tab.handlerState);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_sync_script_error');
    }
  }
}