/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { App, Bootstrap, DIService, injectable } from '@cloudbeaver/core-di';
import { PermissionsService, ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedResource } from '@cloudbeaver/core-sdk';
import { ActionService, DATA_CONTEXT_MENU, DATA_CONTEXT_SUBMENU_ITEM, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';
import { MainMenuService } from '@cloudbeaver/plugin-top-app-bar';
import { MENU_USER_PROFILE } from '@cloudbeaver/plugin-user-profile';

import { ACTION_DEVTOOLS } from './actions/ACTION_DEVTOOLS';
import { DevToolsService } from './DevToolsService';
import { MENU_DEVTOOLS } from './menu/MENU_DEVTOOLS';
import { MENU_PLUGIN } from './menu/MENU_PLUGIN';
import { MENU_PLUGINS } from './menu/MENU_PLUGINS';
import { MENU_RESOURCE } from './menu/MENU_RESOURCE';
import { MENU_RESOURCES } from './menu/MENU_RESOURCES';
import { PluginSubMenuItem } from './menu/PluginSubMenuItem';
import { ResourceSubMenuItem } from './menu/ResourceSubMenuItem';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly app: App,
    private readonly diService: DIService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly mainMenuService: MainMenuService,
    private readonly devToolsService: DevToolsService,
    private readonly permissionsService: PermissionsService,
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => {
        if (!this.permissionsService.has(EAdminPermission.admin)) {
          return false;
        }
        return context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU;
      },
      getItems: (context, items) => [
        ACTION_DEVTOOLS,
        ...items,
      ],
    });


    this.actionService.addHandler({
      id: 'devtools',
      isActionApplicable: (context, action) => [
        ACTION_DEVTOOLS,
      ].includes(action),
      isChecked: (context, action) => {

        switch (action) {
          case ACTION_DEVTOOLS: {
            return this.devToolsService.isEnabled;
          }
        }

        return false;
      },
      handler: (context, action) => {
        switch (action) {
          case ACTION_DEVTOOLS: {
            this.devToolsService.switch();
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => {
        if (!this.devToolsService.isEnabled) {
          return false;
        }
        return context.get(DATA_CONTEXT_MENU) === MENU_USER_PROFILE;
      },
      getItems: (context, items) => [
        MENU_DEVTOOLS,
        ...items,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_DEVTOOLS,
      getItems: (context, items) => [
        MENU_PLUGINS,
        ...items,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_PLUGINS,
      getItems: (context, items) => [
        ...this.app
          .getPlugins()
          .sort((a, b) => a.info.name.localeCompare(b.info.name))
          .map(plugin => new PluginSubMenuItem(plugin)),
        ...items,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => {
        if (context.get(DATA_CONTEXT_MENU) !== MENU_PLUGIN) {
          return false;
        }
        const item = context.tryGet(DATA_CONTEXT_SUBMENU_ITEM);

        if (item instanceof PluginSubMenuItem) {
          return item.plugin.providers.some(provider => provider.prototype instanceof CachedResource);
        }

        return false;
      },
      getItems: (_, items) => [
        MENU_RESOURCES,
        ...items,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => (
        context.get(DATA_CONTEXT_MENU) === MENU_RESOURCES
        && context.has(DATA_CONTEXT_SUBMENU_ITEM)
      ),
      getItems: (context, items) => {
        const item = context.find(DATA_CONTEXT_SUBMENU_ITEM, item => item instanceof PluginSubMenuItem);

        if (!item) {
          return items;
        }

        const plugin = this.app
          .getPlugins()
          .find(plugin => plugin.info.name === item.id);

        if (!plugin) {
          return items;
        }

        return [
          ...plugin.providers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter(service => service.prototype instanceof CachedResource)
            .map(resource => new ResourceSubMenuItem(resource)),
          ...items,
        ];
      },
    });

    this.menuService.addCreator({
      isApplicable: context => (
        context.get(DATA_CONTEXT_MENU) === MENU_RESOURCE
        && context.get(DATA_CONTEXT_SUBMENU_ITEM) instanceof ResourceSubMenuItem
      ),
      getItems: (context, items) => {
        const item = context.get(DATA_CONTEXT_SUBMENU_ITEM) as ResourceSubMenuItem;

        return [
          new MenuBaseItem(
            {
              id: 'markOutdated',
              label: 'Mark outdated',
              tooltip: 'Outdate resource',
            },
            {
              onSelect: () => {
                const instance = this.diService.serviceInjector.getServiceByClass<CachedResource<any, any>>(
                  item.resource
                );
                instance.markOutdated(undefined);
              },
            }
          ),
          ...items,
        ];
      },
    });
  }

  load(): void | Promise<void> {
  }
}