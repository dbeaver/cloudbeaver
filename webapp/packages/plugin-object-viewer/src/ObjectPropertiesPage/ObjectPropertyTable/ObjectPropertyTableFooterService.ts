/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ENodeFeature, getNodeName, NavNode, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-app';
import type { TableState } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService, IMenuContext, IContextMenuItem, IMenuItem,
  CommonDialogService, ConfirmationDialog, DialogueStateResult
} from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

interface IObjectPropertyTableFooterContext {
  nodeIds: string[];
  tableState: TableState;
}

@injectable()
export class ObjectPropertyTableFooterService {
  static objectPropertyContextType = 'objectProperty';
  private objectPropertyTableFooterToken = 'objectPropertyTableFooter';

  constructor(
    private readonly contextMenuService: ContextMenuService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.contextMenuService.addPanel(this.objectPropertyTableFooterToken);

    this.registerMenuItem({
      id: 'delete',
      title: 'ui_delete',
      tooltip: 'ui_delete',
      icon: 'delete',
      order: 0,
      isPresent(context) {
        return context.contextType === ObjectPropertyTableFooterService.objectPropertyContextType;
      },
      isDisabled: context => {
        if (context.data.tableState.selectedList.length === 0) {
          return true;
        }

        const selectedNodes = this.getSelectedNodes(context.data.tableState.selectedList);
        return !selectedNodes.some(node => node.features?.includes(ENodeFeature.canDelete));
      },
      onClick: async context => {
        const nodes = this.getSelectedNodes(context.data.tableState.selectedList)
          .filter(node => node.features?.includes(ENodeFeature.canDelete));
        const nodeNames = nodes.map(getNodeName);

        const result = await this.commonDialogService.open(ConfirmationDialog, {
          title: 'ui_data_delete_confirmation',
          message: `You're going to delete following items: "${nodeNames.join(', ')}". Are you sure?`,
          icon: '/icons/error_icon.svg',
          bigIcon: true,
          confirmActionText: 'ui_delete',
        });

        if (result === DialogueStateResult.Rejected) {
          return;
        }

        const deleted: string[] = [];

        try {
          for (const node of nodes) {
            await this.navTreeResource.deleteNode(node.id);
            deleted.push(node.id);
          }
        } catch (exception) {
          this.notificationService.logException(exception, 'Failed to delete item');
        }

        if (deleted.length) {
          context.data.tableState.unselect(deleted);
        }
      },
    });
  }

  registerMenuItem(options: IContextMenuItem<IObjectPropertyTableFooterContext>): void {
    this.contextMenuService.addMenuItem<IObjectPropertyTableFooterContext>(
      this.objectPropertyTableFooterToken, options
    );
  }

  constructMenuWithContext(nodeIds: string[], tableState: TableState): IMenuItem[] {
    const context: IMenuContext<IObjectPropertyTableFooterContext> = {
      menuId: this.objectPropertyTableFooterToken,
      contextType: ObjectPropertyTableFooterService.objectPropertyContextType,
      data: {
        nodeIds,
        tableState,
      },
    };
    return this.contextMenuService.createContextMenu(context, this.objectPropertyTableFooterToken).menuItems;
  }

  private getSelectedNodes(list: string[]) {
    return this.navNodeInfoResource.get(resourceKeyList(list)).filter(Boolean) as NavNode[];
  }
}
