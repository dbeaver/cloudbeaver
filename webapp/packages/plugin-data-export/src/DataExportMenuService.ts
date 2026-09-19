/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_NAV_NODES, getNodesFromContext, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { withTimestamp } from '@dbeaver/js-helpers';
import { ACTION_EXPORT, ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DataViewerPresentationType,
  DataViewerService,
  type IDataContainerOptions,
  isResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';
import { MENU_OBJECT_VIEWER_FOOTER } from '@cloudbeaver/plugin-object-viewer';
import type { IDataQueryOptions } from '@cloudbeaver/plugin-sql-editor';

import { getNodeExportContexts, type INodeExportConnection, isExportableNode } from './getNodeExportContexts.js';
import type { IExportContext } from './IExportContext.js';

const DataExportDialog = importLazyComponent(() => import('./Dialog/DataExportDialog.js').then(module => module.DataExportDialog));

@injectable(() => [CommonDialogService, ActionService, MenuService, LocalizationService, DataViewerService, ConnectionInfoResource])
export class DataExportMenuService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
    private readonly dataViewerService: DataViewerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {}

  register(): void {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable: context => {
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);
        return this.dataViewerService.canExportData && (!presentation || presentation.type === DataViewerPresentationType.Data);
      },
      getItems(context, items) {
        return [...items, ACTION_EXPORT];
      },
      orderItems(context, items) {
        const extracted = menuExtractItems(items, [ACTION_EXPORT]);
        return [...items, ...extracted];
      },
    });
    this.actionService.addHandler({
      id: 'data-export-base-handler',
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isHidden: (context, action) => !this.dataViewerService.canExportData,
      actions: [ACTION_EXPORT],
      isActionApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        return isResultSetDataSource<IDataContainerOptions & IDataQueryOptions>(model.source);
      },
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        return model.isLoading() || model.isDisabled(resultIndex) || !model.source.getResult(resultIndex);
      },
      getActionInfo(context, action) {
        if (action === ACTION_EXPORT) {
          return { ...action.info, tooltip: 'data_transfer_dialog_export_tooltip', icon: 'table-export' };
        }

        return action.info;
      },
      handler: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (action === ACTION_EXPORT) {
          const result = model.source.getResult(resultIndex);
          const source = model.source;

          if (!result || !isResultSetDataSource<IDataContainerOptions & IDataQueryOptions>(source)) {
            throw new Error('Result must be provided');
          }

          if (!source.options) {
            throw new Error('Source options must be provided');
          }

          this.commonDialogService.open(DataExportDialog, [
            {
              connectionKey: source.options.connectionKey,
              contextId: source.executionContext?.context?.id,
              containerNodePath: source.options.containerNodePath,
              resultId: result.id,
              name: model.name ?? undefined,
              fileName: withTimestamp(model.name ?? this.localizationService.translate('data_transfer_dialog_title')),
              query: source.options.query,
              filter: {
                constraints: source.options.constraints,
                where: source.options.whereFilter,
                anyConstraint: source.options.anyConstraint,
              },
            },
          ]);
        }
      },
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_NAV_NODE],
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        if (!isExportableNode(node)) {
          return false;
        }

        return this.dataViewerService.canExportData && context.has(DATA_CONTEXT_CONNECTION);
      },
      getItems: (context, items) => [...items, ACTION_EXPORT],
    });

    this.actionService.addHandler({
      id: 'data-export',
      actions: [ACTION_EXPORT],
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      handler: async context => {
        // exports every selected node when the tree has a multi-selection, the clicked node otherwise
        await this.openExportDialog(getNodesFromContext(context));
      },
    });

    this.menuService.addCreator({
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      isApplicable: () => this.dataViewerService.canExportData,
      getItems: (context, items) => [...items, ACTION_EXPORT],
      orderItems(context, items) {
        // keep the destructive actions of this footer last
        const extracted = menuExtractItems(items, [ACTION_EXPORT]);
        return [...extracted, ...items];
      },
    });

    this.actionService.addHandler({
      id: 'data-export-object-viewer-footer',
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      actions: [ACTION_EXPORT],
      isHidden: () => !this.dataViewerService.canExportData,
      isDisabled: context => {
        const selected = context.get(DATA_CONTEXT_NAV_NODES)!();

        return !selected.some(isExportableNode);
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_EXPORT) {
          return { ...action.info, tooltip: 'plugin_data_export_export_selected_objects_tooltip', icon: 'table-export' };
        }

        return action.info;
      },
      handler: async context => {
        await this.openExportDialog(context.get(DATA_CONTEXT_NAV_NODES)!());
      },
    });
  }

  private async openExportDialog(nodes: NavNode[]): Promise<void> {
    const contexts = await this.getExportContexts(nodes);

    if (contexts.length === 0) {
      return;
    }

    this.commonDialogService.open(DataExportDialog, contexts);
  }

  private async getExportContexts(nodes: NavNode[]): Promise<IExportContext[]> {
    const connections = new Map<string, INodeExportConnection>();

    for (const node of nodes) {
      if (!isExportableNode(node) || connections.has(node.uri)) {
        continue;
      }

      const nodeConnection = this.connectionInfoResource.getConnectionForNode(node.uri);

      if (!nodeConnection) {
        continue;
      }

      const key = createConnectionParam(nodeConnection);
      const connection = await this.connectionInfoResource.load(key);

      connections.set(node.uri, { key, name: connection.name });
    }

    return getNodeExportContexts(nodes, nodeId => connections.get(nodeId));
  }
}
