/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITab, NavigationTabsService, NavTreeResource, NodeManagerUtils } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { throttleAsync } from '@cloudbeaver/core-utils';
import { NavResourceNodeService } from '@cloudbeaver/plugin-resource-manager';
import { ISqlEditorTabState, SqlEditorService } from '@cloudbeaver/plugin-sql-editor';
import { isSQLEditorTab, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

const SYNC_DELAY = 5 * 1000;

@injectable()
export class SqlEditorTabResourceService {
  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly notificationService: NotificationService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly windowEventsService: WindowEventsService
  ) {
    this.onNodeDeleteHandler = this.onNodeDeleteHandler.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
    this.onFocusChangeHandler = this.onFocusChangeHandler.bind(this);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this.syncTab = throttleAsync(this.syncTab, SYNC_DELAY);
  }

  start() {
    this.navTreeResource.onItemDelete.addHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.addHandler(this.onTabSelectHandler);
    this.windowEventsService.onFocusChange.addHandler(this.onFocusChangeHandler);
  }

  stop() {
    this.navTreeResource.onItemDelete.removeHandler(this.onNodeDeleteHandler);
    this.navigationTabsService.onTabSelect.removeHandler(this.onTabSelectHandler);
    this.windowEventsService.onFocusChange.removeHandler(this.onFocusChangeHandler);
  }

  private onFocusChangeHandler(focused: boolean) {
    if (focused) {
      this.syncCurrentTab();
    }
  }

  private onTabSelectHandler(tab: ITab) {
    if (isSQLEditorTab(tab)) {
      this.syncTab(tab);
    }
  }

  private onNodeDeleteHandler(keyObj: ResourceKey<string>) {
    ResourceKeyUtils.forEach(keyObj, key => {
      const tab = this.sqlEditorTabService.sqlEditorTabs.find(tab => tab.handlerState.associatedScriptId === key);
      if (tab) {
        this.navigationTabsService.closeTab(tab.id);
      }
    });
  }

  private async syncCurrentTab() {
    const current = this.sqlEditorTabService.sqlEditorTabs.find(
      tab => tab.id === this.navigationTabsService.currentTabId
    );

    if (current) {
      await this.syncTab(current);
    }
  }

  private async syncTab(tab: ITab<ISqlEditorTabState>) {
    try {
      if (!tab.handlerState.associatedScriptId) {
        return;
      }

      const parents = NodeManagerUtils.parentsFromPath(tab.handlerState.associatedScriptId);
      const found = await this.navTreeResource.preloadNodeParents(
        parents, tab.handlerState.associatedScriptId
      );

      if (!found) {
        this.notificationService.logInfo({
          title: 'plugin_resource_manager_script_not_found_title',
          message: tab.handlerState.name,
          persistent: true,
        });

        this.sqlEditorService.setAssociatedScriptId('', tab.handlerState);
        return;
      }

      const query = await this.navResourceNodeService.read(tab.handlerState.associatedScriptId);
      this.sqlEditorService.setQuery(query, tab.handlerState);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_sync_script_error');
    }
  }
}