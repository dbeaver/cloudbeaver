/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTreeContextMenuService, NodeManagerUtils, NavNode, EObjectFeature } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { IMenuContext, CommonDialogService, ContextMenuService } from '@cloudbeaver/core-dialogs';
import { TableFooterMenuService, ITableFooterMenuContext, IDatabaseDataSource, IDataContainerOptions } from '@cloudbeaver/plugin-data-viewer';
import type { IDataQueryOptions } from '@cloudbeaver/plugin-sql-editor';

import { DataExportSettingsService } from './DataExportSettingsService';
import { DataExportDialog } from './Dialog/DataExportDialog';

@injectable()
export class DataExportMenuService {
  constructor(
    private commonDialogService: CommonDialogService,
    private tableFooterMenuService: TableFooterMenuService,
    private contextMenuService: ContextMenuService,
    private dataExportSettingsService: DataExportSettingsService,
  ) { }

  register(): void {
    this.tableFooterMenuService.registerMenuItem({
      id: 'export ',
      order: 5,
      title: 'data_transfer_dialog_export',
      tooltip: 'data_transfer_dialog_export_tooltip',
      icon: 'table-export',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden: () => this.dataExportSettingsService.settings.getValue('disabled'),
      isDisabled(context) {
        return context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.getResult(context.data.resultIndex);
      },
      onClick: this.exportData.bind(this),
    });

    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'export',
        order: 2,
        title: 'data_transfer_dialog_export',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataContainer);
        },
        isHidden: () => this.dataExportSettingsService.settings.getValue('disabled'),
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

    const source = context.data.model.source as IDatabaseDataSource<IDataContainerOptions & IDataQueryOptions>;

    if (!source.options) {
      throw new Error('Source options must be provided');
    }

    this.commonDialogService.open(DataExportDialog, {
      connectionId: source.options.connectionId,
      contextId: context.data.model.source.executionContext?.context?.id,
      containerNodePath: source.options.containerNodePath,
      resultId: result.id,
      sourceName: source.options.query,
    });
  }
}
