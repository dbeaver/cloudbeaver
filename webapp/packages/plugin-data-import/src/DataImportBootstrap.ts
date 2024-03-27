/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ACTION_IMPORT, ActionService, DATA_CONTEXT_MENU, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DatabaseEditAction,
} from '@cloudbeaver/plugin-data-viewer';

import { DataImportDialogLazy } from './DataImportDialog/DataImportDialogLazy';
import type { IDataImportDialogState } from './DataImportDialog/IDataImportDialogState';
import { DataImportService } from './DataImportService';

@injectable()
export class DataImportBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly dataImportService: DataImportService,
  ) {
    super();
  }

  register() {
    this.actionService.addHandler({
      id: 'data-import-base-handler',
      isActionApplicable(context, action) {
        const menu = context.hasValue(DATA_CONTEXT_MENU, DATA_VIEWER_DATA_MODEL_ACTIONS_MENU);
        const model = context.tryGet(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.tryGet(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        if (!menu || !model || resultIndex === undefined) {
          return false;
        }

        if (action === ACTION_IMPORT) {
          if (model.isReadonly(resultIndex)) {
            return false;
          }

          const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);
          return editor?.hasFeature('add') === true;
        }

        return [ACTION_IMPORT].includes(action);
      },
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        return model.isLoading() || model.isDisabled(resultIndex) || !model.getResult(resultIndex);
      },
      getActionInfo(_, action) {
        if (action === ACTION_IMPORT) {
          return { ...action.info, icon: '/icons/data-import.png' };
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        if (action === ACTION_IMPORT) {
          const result = model.getResult(resultIndex);

          if (!result?.id) {
            throw new Error('Result must be provided');
          }

          const executionContext = model.source.executionContext?.context;

          if (!executionContext) {
            throw new Error('Execution context must be provided');
          }

          await this.openImportDataDialog(
            executionContext.connectionId,
            executionContext.id,
            executionContext.projectId,
            result.id,
            model.name ?? model.id,
            undefined,
            () => model.refresh(),
          );
        }
      },
    });

    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      isApplicable: () => !this.dataImportService.disabled,
      getItems(_, items) {
        return [...items, ACTION_IMPORT];
      },
      orderItems(_, items) {
        const extracted = menuExtractItems(items, [ACTION_IMPORT]);
        return [...items, ...extracted];
      },
    });
  }

  private async openImportDataDialog(
    connectionId: string,
    contextId: string,
    projectId: string,
    resultsId: string,
    tableName: string,
    initialState?: IDataImportDialogState,
    onSuccess?: () => void,
  ) {
    const state = await this.commonDialogService.open(DataImportDialogLazy, { tableName, initialState });

    if (state === DialogueStateResult.Rejected || state === DialogueStateResult.Resolved) {
      return;
    }

    if (!state.files) {
      throw new Error('Files must be provided');
    }

    if (!state.selectedProcessor) {
      throw new Error('Processor must be provided');
    }

    try {
      await this.dataImportService.importData(connectionId, contextId, projectId, resultsId, state.selectedProcessor.id, state.files);
      onSuccess?.();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_data_import_process_fail');
      await this.openImportDataDialog(connectionId, contextId, projectId, resultsId, tableName, state, onSuccess);
    }
  }
}
