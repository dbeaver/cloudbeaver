/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ACTION_IMPORT, ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  ContainerDataSource,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DataViewerPresentationType,
  isResultSetDataModel,
} from '@cloudbeaver/plugin-data-viewer';

import { DataImportDialogLazy } from './DataImportDialog/DataImportDialogLazy.js';
import { DataImportService } from './DataImportService.js';

@injectable()
export class DataImportBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly dataImportService: DataImportService,
  ) {
    super();
  }

  override register() {
    this.actionService.addHandler({
      id: 'data-import-base-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      actions: [ACTION_IMPORT],
      isActionApplicable: context => isResultSetDataModel(context.get(DATA_CONTEXT_DV_DDM)),
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        return model.isLoading() || model.isDisabled(resultIndex) || !model.source.getResult(resultIndex);
      },
      getActionInfo(_, action) {
        if (action === ACTION_IMPORT) {
          return { ...action.info, icon: '/icons/data-import.svg' };
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as any;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (!isResultSetDataModel(model)) {
          throw new Error('Execution context is not provided');
        }

        if (action === ACTION_IMPORT) {
          const result = model.source.getResult(resultIndex);

          if (!result?.id) {
            throw new Error('Result must be provided');
          }

          const executionContext = model.source.executionContext?.context;

          if (!executionContext) {
            throw new Error('Execution context must be provided');
          }

          const state = await this.commonDialogService.open(DataImportDialogLazy, { tableName: model.name ?? model.id });

          if (state === DialogueStateResult.Rejected || state === DialogueStateResult.Resolved) {
            return;
          }

          const success = await this.dataImportService.importData(
            executionContext.connectionId,
            executionContext.id,
            executionContext.projectId,
            result.id,
            state.processorId,
            state.file,
          );

          if (success) {
            await model.refresh();
          }
        }
      },
    });

    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);
        const isContainer = model.source instanceof ContainerDataSource;
        return (
          !model.isReadonly(resultIndex) &&
          isContainer &&
          !this.dataImportService.disabled &&
          !presentation?.readonly &&
          (!presentation || presentation.type === DataViewerPresentationType.Data)
        );
      },
      getItems(_, items) {
        return [...items, ACTION_IMPORT];
      },
      orderItems(_, items) {
        const extracted = menuExtractItems(items, [ACTION_IMPORT]);
        return [...items, ...extracted];
      },
    });
  }
}
