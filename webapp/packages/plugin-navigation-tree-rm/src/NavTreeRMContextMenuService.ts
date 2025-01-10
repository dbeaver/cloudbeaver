/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { RenameDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, ENodeFeature } from '@cloudbeaver/core-navigation-tree';
import { isResourceOfType, ProjectInfoResource, type ProjectInfoResourceType } from '@cloudbeaver/core-projects';
import { getRmResourceKey, isRMResourceNode, NAV_NODE_TYPE_RM_FOLDER, NAV_NODE_TYPE_RM_RESOURCE } from '@cloudbeaver/core-resource-manager';
import { createPath, getPathParent } from '@cloudbeaver/core-utils';
import { ACTION_DELETE, ACTION_RENAME, ActionService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_NAV_NODE_ACTIONS } from '@cloudbeaver/plugin-navigation-tree';

import { getResourceKeyFromNodeId } from './NavNodes/getResourceKeyFromNodeId.js';
import { NavResourceNodeService } from './NavResourceNodeService.js';

@injectable()
export class NavTreeRMContextMenuService extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
  }

  override register(): void {
    this.actionService.addHandler({
      id: 'nav-node-rm-handler',
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: (context, action): boolean => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        if (![NAV_NODE_TYPE_RM_RESOURCE, NAV_NODE_TYPE_RM_FOLDER].includes(node.nodeType as string)) {
          return false;
        }

        if (action === ACTION_RENAME) {
          return node.features?.includes(ENodeFeature.canRename) ?? false;
        }

        if (action === ACTION_DELETE) {
          return node.features?.includes(ENodeFeature.canDelete) ?? false;
        }

        return false;
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        const resourceKey = getResourceKeyFromNodeId(node.id);

        if (!resourceKey) {
          return;
        }

        const key = getRmResourceKey(resourceKey);
        const project = this.projectInfoResource.get(key.projectId);

        let resourceType: ProjectInfoResourceType | undefined = undefined;
        if (project) {
          for (const type of project.resourceTypes) {
            if (isResourceOfType(type, node.id)) {
              resourceType = type;
              break;
            }
          }
        }

        switch (action) {
          case ACTION_RENAME: {
            const actions = context.get(DATA_CONTEXT_NAV_NODE_ACTIONS);

            const save = async (newName: string) => {
              if (key.name !== newName && newName.trim().length) {
                if (resourceType && isRMResourceNode(node) && !node.folder) {
                  newName = this.projectInfoResource.getNameWithExtension(key.projectId, resourceType.id, newName);
                }

                try {
                  await this.navResourceNodeService.move(resourceKey, createPath(getPathParent(resourceKey), newName));
                  node.name = newName; // fix name flickering in tree
                } catch (exception: any) {
                  this.notificationService.logException(exception, 'app_navigationTree_node_rename_error');
                  return false;
                }
              }
              return true;
            };

            if (actions?.rename) {
              actions.rename(save);
            } else {
              const result = await this.commonDialogService.open(RenameDialog, {
                name: key.name ?? '',
                subTitle: key.name,
                objectName: node.nodeType || 'Object',
                icon: node.icon,
                validation: name => name.trim().length > 0,
              });

              if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
                save(result);
              }
            }
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.navResourceNodeService.delete(resourceKey);
            } catch (exception: any) {
              this.notificationService.logException(
                exception,
                this.localizationService.translate('app_navigationTree_node_delete_error', undefined, { name: key.name }),
              );
            }
            break;
          }
        }
      },
    });
  }
}
