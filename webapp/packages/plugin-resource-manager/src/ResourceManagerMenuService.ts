/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_NAV_NODE, MENU_NAV_TREE } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';

import { ACTION_DELETE_RESOURCE } from './Actions/ACTION_DELETE_RESOURCE';
import { ACTION_OPEN_SCRIPT } from './Actions/ACTION_OPEN_SCRIPT';
import { ScriptsManagerService } from './ScriptsManager/ScriptsManagerService';

@injectable()
export class ResourceManagerMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly scriptsManagerService: ScriptsManagerService,
    private readonly commonDialogService: CommonDialogService,
  ) { }

  register() {
    this.actionService.addHandler({
      id: 'resource-manager-base-actions',
      isActionApplicable: (contexts, action) => {
        if (!contexts.has(DATA_CONTEXT_NAV_NODE)) {
          return false;
        }

        const node = contexts.get(DATA_CONTEXT_NAV_NODE);

        if (action === ACTION_OPEN_SCRIPT || action === ACTION_DELETE_RESOURCE) {
          return this.scriptsManagerService.isScript(node.id);
        }

        return false;
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        switch (action) {
          case ACTION_OPEN_SCRIPT:
            await this.scriptsManagerService.openScript(node);
            break;
          case ACTION_DELETE_RESOURCE: {
            const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
              title: 'ui_data_delete_confirmation',
              message: `You are going to delete "${node.name}". Are you sure?`,
              confirmActionText: 'ui_delete',
            });

            if (result === DialogueStateResult.Resolved) {
              this.scriptsManagerService.deleteScript(node.id);
            }
          }
            break;
          default:
            break;
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_NAV_TREE,
      getItems: (context, items) => [
        ACTION_OPEN_SCRIPT,
        ACTION_DELETE_RESOURCE,
        ...items,
      ],
    });
  }
}