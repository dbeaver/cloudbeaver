/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_NAV_NODE, EMainMenu, MainMenuService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { ActionService, ACTION_DELETE, MenuService } from '@cloudbeaver/core-view';
import { isScript } from '@cloudbeaver/plugin-sql-editor-navigation-tab-resource';

import { NavResourceNodeService, PROJECT_NODE_TYPE, RESOURCE_NODE_TYPE } from './NavResourceNodeService';
import { ResourceManager } from './ResourceManager';
import { ResourceManagerService } from './ResourceManagerService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuToolsPanel,
      {
        id: 'resourceManagementTrigger',
        order: 3,
        type: 'checkbox',
        title: 'plugin_resource_manager_title',
        isHidden: () => !this.resourceManagerService.enabled,
        isChecked: () => this.resourceManagerService.panelEnabled,
        onClick: this.resourceManagerService.togglePanel,
      }
    );

    this.sideBarPanelService.tabsContainer.add({
      key: 'resource-manager-tab',
      order: 0,
      name: 'plugin_resource_manager_title',
      isHidden: () => !this.resourceManagerService.enabled || !this.resourceManagerService.panelEnabled,
      onClose: this.resourceManagerService.togglePanel,
      panel: () => ResourceManager,
    });

    this.actionService.addHandler({
      id: 'resource-manager-base-actions',
      isActionApplicable: (context, action) => {
        if (!context.has(DATA_CONTEXT_NAV_NODE)) {
          return false;
        }

        const node = context.get(DATA_CONTEXT_NAV_NODE);

        if (action === ACTION_DELETE) {
          return isScript(node.id);
        }

        return false;
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        if (action === ACTION_DELETE) {
          const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
            title: 'ui_data_delete_confirmation',
            message: this.localizationService.translate('plugin_resource_manager_script_delete_confirmation', undefined, { name: node.name }),
            confirmActionText: 'ui_delete',
          });

          if (result === DialogueStateResult.Resolved) {
            try {
              await this.navResourceNodeService.delete(node.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_resource_manager_delete_script_error');
            }
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);
        return !!node?.nodeType && [PROJECT_NODE_TYPE, RESOURCE_NODE_TYPE].includes(node.nodeType);
      },
      getItems: (context, items) => items,
    });
  }

  async load(): Promise<void> { }
}