/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_CONNECTION, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ActionService, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import {
  CONNECTION_NAVIGATOR_VIEW_SETTINGS,
  EAdminPermission,
  isNavigatorViewSettingsEqual,
  PermissionsService,
  type NavigatorViewSettings,
} from '@cloudbeaver/core-root';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ConnectionFormService, PluginConnectionsSettingsService } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_VIEW_SIMPLE } from './Actions/ACTION_CONNECTION_VIEW_SIMPLE.js';
import { ACTION_CONNECTION_VIEW_ADVANCED } from './Actions/ACTION_CONNECTION_VIEW_ADVANCED.js';
import { ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS } from './Actions/ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS.js';
import { MENU_CONNECTION_VIEW } from './MENU_CONNECTION_VIEW.js';
import { ACTION_CONNECTION_VIEW_RESET } from './Actions/ACTION_CONNECTION_VIEW_RESET.js';
import { ConnectionViewService } from './ConnectionViewService.js';
import { ConnectionViewResource } from './ConnectionViewResource.js';

const ConnectionViewForm = importLazyComponent(() => import('./ConnectionViewForm.js').then(m => m.ConnectionViewForm));

@injectable(() => [
  ActionService,
  MenuService,
  PluginConnectionsSettingsService,
  PermissionsService,
  ConnectionFormService,
  ProjectInfoResource,
  ConnectionViewService,
  ConnectionViewResource,
])
export class ConnectionViewPluginBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly pluginConnectionsSettingsService: PluginConnectionsSettingsService,
    private readonly permissionsService: PermissionsService,
    private readonly connectionFormService: ConnectionFormService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionViewService: ConnectionViewService,
    private readonly connectionViewResource: ConnectionViewResource,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      isApplicable: context => {
        if (this.pluginConnectionsSettingsService.hideConnectionViewForUsers && !this.permissionsService.has(EAdminPermission.admin)) {
          return false;
        }

        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      getItems: (context, items) => [...items, MENU_CONNECTION_VIEW],
    });

    this.menuService.addCreator({
      menus: [MENU_CONNECTION_VIEW],
      getItems: (context, items) => [
        ...items,
        ACTION_CONNECTION_VIEW_SIMPLE,
        ACTION_CONNECTION_VIEW_ADVANCED,
        new MenuSeparatorItem(),
        ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS,
        ACTION_CONNECTION_VIEW_RESET,
      ],
    });

    this.actionService.addHandler({
      id: 'connection-view',
      actions: [ACTION_CONNECTION_VIEW_SIMPLE, ACTION_CONNECTION_VIEW_ADVANCED, ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS, ACTION_CONNECTION_VIEW_RESET],
      contexts: [DATA_CONTEXT_CONNECTION],
      isActionApplicable: (context, action) => {
        if (action === ACTION_CONNECTION_VIEW_RESET) {
          const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
          const settings = this.connectionViewResource.get(connectionKey);

          if (settings) {
            const isShared = this.projectInfoResource.isProjectShared(settings.projectId);
            return settings.navigatorSettings.userSettings && isShared;
          }
        }

        return true;
      },
      isChecked: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const settings = this.connectionViewResource.get(connectionKey);

        if (!settings) {
          return false;
        }

        switch (action) {
          case ACTION_CONNECTION_VIEW_SIMPLE: {
            return isNavigatorViewSettingsEqual(settings.navigatorSettings, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
          }
          case ACTION_CONNECTION_VIEW_ADVANCED: {
            return isNavigatorViewSettingsEqual(settings.navigatorSettings, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced);
          }
          case ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS: {
            return settings.navigatorSettings.showSystemObjects;
          }
        }

        return false;
      },
      handler: async (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const settings = await this.connectionViewResource.load(connectionKey);

        switch (action) {
          case ACTION_CONNECTION_VIEW_SIMPLE: {
            await this.changeConnectionView(connectionKey, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
            break;
          }
          case ACTION_CONNECTION_VIEW_ADVANCED: {
            await this.changeConnectionView(connectionKey, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced);
            break;
          }
          case ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS: {
            const currentSettings = settings.navigatorSettings;

            await this.changeConnectionView(connectionKey, {
              ...currentSettings,
              showSystemObjects: !currentSettings.showSystemObjects,
            });
            break;
          }
          case ACTION_CONNECTION_VIEW_RESET: {
            await this.connectionViewService.clearConnectionView(connectionKey);
            break;
          }
        }
      },
      getLoader: context => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        return getCachedMapResourceLoaderState(this.connectionViewResource, () => connectionKey, undefined, true);
      },
    });

    this.connectionFormService.connectionContainer.add(
      ConnectionViewForm,
      undefined,
      props => !this.projectInfoResource.isProjectShared(props.formState.state.projectId),
    );
  }

  private async changeConnectionView(connectionKey: IConnectionInfoParams, settings: NavigatorViewSettings): Promise<void> {
    await this.connectionViewService.changeConnectionView(connectionKey, { ...settings, userSettings: true });
  }
}
