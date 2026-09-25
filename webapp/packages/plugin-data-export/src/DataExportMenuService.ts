/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION, type IConnectionInfoParams, serializeConnectionParam } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
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

@injectable(() => [
  CommonDialogService,
  ActionService,
  MenuService,
  LocalizationService,
  DataViewerService,
  ConnectionInfoResource,
  NotificationService,
])
export class DataExportMenuService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
    private readonly dataViewerService: DataViewerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly notificationService: NotificationService,
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
        if (!this.dataViewerService.canExportData || !context.has(DATA_CONTEXT_CONNECTION)) {
          return false;
        }

        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        if (isExportableNode(node)) {
          return true;
        }

        // the menu may be opened on a non-exportable node of a selection that contains exportable ones
        return getNodesFromContext(context).some(isExportableNode);
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
    // node.uri -> connection id, and connection id -> key, so every distinct connection loads exactly once
    const nodeConnectionIds = new Map<string, string>();
    const connectionKeysById = new Map<string, IConnectionInfoParams>();
    let unresolvedCount = 0;

    for (const node of nodes) {
      if (!isExportableNode(node) || nodeConnectionIds.has(node.uri)) {
        continue;
      }

      // the key is derived from the node, the connection of a selected node may not be cached yet
      const key = node.projectId ? this.connectionInfoResource.getConnectionIdForNodeId(node.projectId, node.uri) : undefined;

      if (!key) {
        unresolvedCount++;
        continue;
      }

      const connectionId = serializeConnectionParam(key);
      nodeConnectionIds.set(node.uri, connectionId);
      connectionKeysById.set(connectionId, key);
    }

    if (unresolvedCount > 0) {
      // an exportable node whose connection can't even be identified is skipped without a network call,
      // so it needs its own notification instead of relying on the connection-load failure below
      this.notificationService.logInfo({
        title: 'plugin_data_export_skipped_objects_title',
        message: this.localizationService.translate('plugin_data_export_skipped_objects_message', undefined, { count: unresolvedCount }),
      });
    }

    // resolve every distinct connection once, in parallel, instead of one sequential round trip per node;
    // an unavailable connection skips its own objects instead of cancelling the whole selection
    const connectionsById = new Map<string, INodeExportConnection>();

    await Promise.all(
      Array.from(connectionKeysById, async ([connectionId, key]) => {
        try {
          connectionsById.set(connectionId, { key, name: (await this.connectionInfoResource.load(key)).name });
        } catch (exception: any) {
          this.notificationService.logException(exception, 'plugin_data_export_connection_load_fail');
        }
      }),
    );

    return getNodeExportContexts(nodes, nodeUri => {
      const connectionId = nodeConnectionIds.get(nodeUri);
      return connectionId ? connectionsById.get(connectionId) : undefined;
    });
  }
}
