/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { createConnectionParam, DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { withTimestamp } from '@cloudbeaver/core-utils';
import { ACTION_EXPORT, ActionService, DATA_CONTEXT_MENU, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  IDatabaseDataSource,
  IDataContainerOptions,
} from '@cloudbeaver/plugin-data-viewer';
import type { IDataQueryOptions } from '@cloudbeaver/plugin-sql-editor';

import { DataExportSettingsService } from './DataExportSettingsService';

const DataExportDialog = importLazyComponent(() => import('./Dialog/DataExportDialog').then(module => module.DataExportDialog));

@injectable()
export class DataExportMenuService {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly dataExportSettingsService: DataExportSettingsService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly localizationService: LocalizationService,
  ) {}

  register(): void {
    this.actionService.addHandler({
      id: 'data-export-base-handler',
      isActionApplicable(context, action) {
        const menu = context.hasValue(DATA_CONTEXT_MENU, DATA_VIEWER_DATA_MODEL_ACTIONS_MENU);
        const model = context.tryGet(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.tryGet(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        if (!menu || !model || resultIndex === undefined) {
          return false;
        }

        return [ACTION_EXPORT].includes(action);
      },
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        return model.isLoading() || model.isDisabled(resultIndex) || !model.getResult(resultIndex);
      },
      getActionInfo(context, action) {
        if (action === ACTION_EXPORT) {
          return { ...action.info, icon: 'table-export' };
        }

        return action.info;
      },
      handler: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        if (action === ACTION_EXPORT) {
          const result = model.getResult(resultIndex);

          if (!result) {
            throw new Error('Result must be provided');
          }

          const source = model.source as IDatabaseDataSource<IDataContainerOptions & IDataQueryOptions>;

          if (!source.options) {
            throw new Error('Source options must be provided');
          }

          this.commonDialogService.open(DataExportDialog, {
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
            },
          });
        }
      },
    });
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      isApplicable: () => !this.isExportDisabled(),
      getItems(context, items) {
        return [...items, ACTION_EXPORT];
      },
      orderItems(context, items) {
        const extracted = menuExtractItems(items, [ACTION_EXPORT]);
        return [...items, ...extracted];
      },
    });

    this.menuService.addCreator({
      root: true,
      isApplicable: context => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataContainer)) {
          return false;
        }

        return !this.isExportDisabled() && context.has(DATA_CONTEXT_CONNECTION);
      },
      getItems: (context, items) => [...items, ACTION_EXPORT],
    });

    this.actionService.addHandler({
      id: 'data-export',
      actions: [ACTION_EXPORT],
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      handler: async context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const connection = context.get(DATA_CONTEXT_CONNECTION);
        const fileName = withTimestamp(`${connection.name}${node?.name ? ` - ${node.name}` : ''}`);

        this.commonDialogService.open(DataExportDialog, {
          connectionKey: createConnectionParam(connection),
          name: node?.name,
          fileName,
          containerNodePath: node?.id,
        });
      },
    });
  }

  private isExportDisabled() {
    if (this.sessionPermissionsResource.has(EAdminPermission.admin)) {
      return false;
    }

    return this.dataExportSettingsService.disabled;
  }
}
