/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { INodeNavigationData, NavigationTabsService, NavNodeInfoResource, NavNodeManagerService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ScriptsManagerService } from '@cloudbeaver/plugin-resource-manager';
import { SqlEditorNavigatorService, SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly scriptsManagerService: ScriptsManagerService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  load(): void | Promise<void> { }

  private async navigationHandler(data: INodeNavigationData) {
    if (this.scriptsManagerService.isScript(data.nodeId)) {
      try {
        const existingTab = this.sqlEditorTabService.sqlEditorTabs.find(
          tab => tab.handlerState.associatedScriptId === data.nodeId
        );

        if (existingTab) {
          this.navigationTabsService.selectTab(existingTab.id);
        } else {
          const scriptValue = await this.scriptsManagerService.readScript(data.nodeId);

          const node = await this.navNodeInfoResource.load(data.nodeId);
          await this.sqlEditorNavigatorService.openNewEditor({
            name: node.name ?? 'Unknown script',
            query: scriptValue,
            associatedScriptId: data.nodeId,
          });
        }
      } catch (exception) {
        this.notificationService.logException(exception as any, 'plugin_resource_manager_open_script_error');
      }
    }
  }
}