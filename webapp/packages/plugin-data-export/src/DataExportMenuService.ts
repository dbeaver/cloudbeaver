/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTreeContextMenuService, NodeManagerUtils, NavNode, EObjectFeature
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import {
  IMenuContext, CommonDialogService, ContextMenuService
} from '@cloudbeaver/core-dialogs';
import { TableFooterMenuService, ITableFooterMenuContext } from '@cloudbeaver/plugin-data-viewer';

import { DataExportDialog } from './Dialog/DataExportDialog';

@injectable()
export class DataExportMenuService {
  constructor(
    private commonDialogService: CommonDialogService,
    private tableFooterMenuService: TableFooterMenuService,
    private contextMenuService: ContextMenuService
  ) { }

  register(): void {
    this.tableFooterMenuService.registerMenuItem({
      id: 'export ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      order: 5,
      title: 'data_transfer_dialog_export',
      icon: 'table-export',
      onClick: this.exportData.bind(this),
    });

    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'export',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataContainer);
        },
        order: 2,
        title: 'data_transfer_dialog_export',
        onClick: context => {
          const node = context.data;
          const connectionId = NodeManagerUtils.nodeIdToConnectionId(node.id);
          this.commonDialogService.open(DataExportDialog, {
            connectionId,
            containerNodePath: node.id,
          });
        },
      }
    );
  }

  private exportData(context: IMenuContext<ITableFooterMenuContext>) {
    const result = context.data.model.getResult(context.data.resultIndex);
    if (!result) {
      throw new Error('Result must be provided');
    }

    this.commonDialogService.open(DataExportDialog, {
      connectionId: context.data.model.deprecatedModel.connectionId,
      contextId: context.data.model.source.executionContext?.contextId,
      containerNodePath: context.data.model.deprecatedModel.containerNodePath,
      resultId: result.id,
      sourceName: context.data.model.deprecatedModel.sourceName,
    });
  }
}
