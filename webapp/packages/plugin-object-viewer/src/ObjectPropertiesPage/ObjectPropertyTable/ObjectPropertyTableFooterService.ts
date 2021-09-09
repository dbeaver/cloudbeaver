/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DBObjectService, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-app';
import type { ITableState } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService, IMenuContext, IContextMenuItem, IMenuItem,
  CommonDialogService, ConfirmationDialog, DialogueStateResult
} from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { getValue } from '../helpers';

const NAME_PROPERTY_ID = 'name';

interface IObjectPropertyTableFooterContext {
  nodeIds: string[];
  tableState: ITableState;
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
    private readonly dbObjectService: DBObjectService,
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
      isDisabled(context) {
        return context.data.tableState.selectedList.length === 0;
      },
      onClick: async context => {
        const nodeNames = this.getNodeNames(context.data.tableState.selectedList);

        const result = await this.commonDialogService.open(ConfirmationDialog, {
          title: 'ui_data_delete_confirmation',
          message: `You're going to delete following items: "${nodeNames.join(', ')}". Are you sure?`,
          icon: '/icons/error_icon_sm.svg',
          confirmActionText: 'ui_delete',
        });

        if (result === DialogueStateResult.Rejected) {
          return;
        }

        const deleted: string[] = [];

        try {
          for (const path of context.data.tableState.selectedList) {
            await this.navTreeResource.deleteNode(path);
            deleted.push(path);
          }
        } catch (exception) {
          this.notificationService.logException(exception, 'Failed to delete item');
        }

        if (deleted.length) {
          context.data.tableState.unselect(deleted);
          const title = deleted.length > 1 ? 'Items were deleted' : 'Item was deleted';
          this.notificationService.logSuccess({ title });
        }
      },
    });
  }

  registerMenuItem(options: IContextMenuItem<IObjectPropertyTableFooterContext>): void {
    this.contextMenuService.addMenuItem<IObjectPropertyTableFooterContext>(
      this.objectPropertyTableFooterToken, options
    );
  }

  constructMenuWithContext(nodeIds: string[], tableState: ITableState): IMenuItem[] {
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

  private getNodeNames(selected: string[]) {
    return selected.reduce((acc: string[], path) => {
      const node = this.navNodeInfoResource.get(path);
      const dbObject = this.dbObjectService.get(path);

      const nameProperty = dbObject?.properties?.find(property => property.id === NAME_PROPERTY_ID);

      if (node) {
        const name = nameProperty ? getValue(nameProperty.value) : node.name;
        acc.push(`${node.nodeType || 'Object'}${name ? ' (' + name + ')' : ''}`);
      }

      return acc;
    }, []);
  }
}
