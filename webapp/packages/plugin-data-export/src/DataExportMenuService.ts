/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EObjectFeature, DATA_CONTEXT_NAV_NODE } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { IMenuContext, CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ActionService, ACTION_EXPORT, DATA_CONTEXT_MENU_NESTED, MenuService } from '@cloudbeaver/core-view';
import { TableFooterMenuService, ITableFooterMenuContext, IDatabaseDataSource, IDataContainerOptions } from '@cloudbeaver/plugin-data-viewer';
import type { IDataQueryOptions } from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_CONNECTION } from '../../plugin-connections/src';
import { DataExportSettingsService } from './DataExportSettingsService';
import { DataExportDialog } from './Dialog/DataExportDialog';

@injectable()
export class DataExportMenuService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly tableFooterMenuService: TableFooterMenuService,
    private readonly dataExportSettingsService: DataExportSettingsService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
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

    this.menuService.addCreator({
      isApplicable: context => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataContainer)) {
          return false;
        }

        return (
          !this.dataExportSettingsService.settings.getValue('disabled')
          && context.has(DATA_CONTEXT_CONNECTION)
          && !context.has(DATA_CONTEXT_MENU_NESTED)
        );
      },
      getItems: (context, items) => [
        ...items,
        ACTION_EXPORT,
      ],
    });

    this.actionService.addHandler({
      id: 'data-export',
      isActionApplicable: (context, action) => (
        action === ACTION_EXPORT
        && context.has(DATA_CONTEXT_CONNECTION)
        && context.has(DATA_CONTEXT_NAV_NODE)
      ),
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        this.commonDialogService.open(DataExportDialog, {
          connectionId: connection.id,
          containerNodePath: node.id,
        });
      },
    });
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
      filter: {
        constraints: source.options.constraints,
        where: source.options.whereFilter,
      },
    });
  }
}
