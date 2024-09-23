/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DatabaseDataResultAction,
  DataPresentationService,
  DataPresentationType,
  DataViewerPresentationType,
  type IDatabaseDataModel,
  isResultSetDataSource,
  ResultSetDataAction,
  ResultSetDataSource,
  ResultSetSelectAction,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_VIEWER_GROUPING_CLEAR } from './Actions/ACTION_DATA_VIEWER_GROUPING_CLEAR.js';
import { ACTION_DATA_VIEWER_GROUPING_CONFIGURE } from './Actions/ACTION_DATA_VIEWER_GROUPING_CONFIGURE.js';
import { ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN } from './Actions/ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN.js';
import { ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES } from './Actions/ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES.js';
import { DATA_CONTEXT_DV_DDM_RS_GROUPING } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING.js';

const DVGroupingColumnEditorDialog = importLazyComponent(() =>
  import('./DVGroupingColumnEditorDialog/DVGroupingColumnEditorDialog.js').then(module => module.DVGroupingColumnEditorDialog),
);
const DVResultSetGroupingPresentation = importLazyComponent(() =>
  import('./DVResultSetGroupingPresentation.js').then(module => module.DVResultSetGroupingPresentation),
);

@injectable()
export class DVResultSetGroupingPluginBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.registerPresentation();
    this.registerActions();
  }

  private registerActions(): void {
    this.actionService.addHandler({
      id: 'data-viewer-grouping-menu-base-handler',
      actions: [
        ACTION_DATA_VIEWER_GROUPING_CLEAR,
        ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN,
        ACTION_DATA_VIEWER_GROUPING_CONFIGURE,
        ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES,
      ],
      contexts: [DATA_CONTEXT_DV_DDM_RS_GROUPING],
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      isActionApplicable(context, action) {
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        if ((presentation && presentation.type !== DataViewerPresentationType.Data) || !isResultSetDataSource(model.source)) {
          return false;
        }
        switch (action) {
          case ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN:
            return context.has(DATA_CONTEXT_DV_DDM) && context.has(DATA_CONTEXT_DV_DDM_RESULT_INDEX);
          case ACTION_DATA_VIEWER_GROUPING_CLEAR:
          case ACTION_DATA_VIEWER_GROUPING_CONFIGURE:
          case ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES:
            return true;
        }
        return false;
      },
      getActionInfo(context, action) {
        const grouping = context.get(DATA_CONTEXT_DV_DDM_RS_GROUPING)!;
        const isShowDuplicatesOnly = grouping.getShowDuplicatesOnly();

        if (action === ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES && isShowDuplicatesOnly) {
          return {
            ...action.info,
            label: 'plugin_data_viewer_result_set_grouping_action_show_all',
            tooltip: 'plugin_data_viewer_result_set_grouping_action_show_all',
            icon: '/icons/plugin_data_viewer_result_set_grouping_show_all_sm.svg',
          };
        }

        return action.info;
      },
      isDisabled(context, action) {
        const grouping = context.get(DATA_CONTEXT_DV_DDM_RS_GROUPING)!;

        switch (action) {
          case ACTION_DATA_VIEWER_GROUPING_CLEAR:
            return grouping.getColumns().length === 0;
          case ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN: {
            const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
            const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
            if (!model.source.hasResult(resultIndex)) {
              return true;
            }

            const format = model.source.getResult(resultIndex)?.dataFormat;

            if (format === ResultDataFormat.Resultset) {
              const selectionAction = model.source.getAction(resultIndex, ResultSetSelectAction);
              const dataAction = model.source.getAction(resultIndex, ResultSetDataAction);

              return !grouping.getColumns().some(name => {
                const key = dataAction.findColumnKey(column => column.name === name);

                if (!key) {
                  return false;
                }

                return selectionAction.isElementSelected({ column: key });
              });
            }

            return true;
          }
        }

        return false;
      },
      handler: async (context, action) => {
        const grouping = context.get(DATA_CONTEXT_DV_DDM_RS_GROUPING)!;

        switch (action) {
          case ACTION_DATA_VIEWER_GROUPING_CLEAR:
            grouping.clear();
            break;
          case ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN: {
            const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
            const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
            const selectionAction = model.source.getAction(resultIndex, ResultSetSelectAction);
            const dataAction = model.source.getAction(resultIndex, ResultSetDataAction);

            const columnsToRemove = grouping.getColumns().filter(name => {
              const key = dataAction.findColumnKey(column => column.name === name);

              if (!key) {
                return false;
              }

              return selectionAction.isElementSelected({ column: key });
            });

            grouping.removeColumn(...columnsToRemove);
            break;
          }
          case ACTION_DATA_VIEWER_GROUPING_CONFIGURE:
            await this.commonDialogService.open(DVGroupingColumnEditorDialog, { grouping });
            break;
          case ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES:
            grouping.setShowDuplicatesOnly(!grouping.getShowDuplicatesOnly());
            break;
        }
      },
    });
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM_RS_GROUPING],
      getItems(context, items) {
        return [
          ...items,
          ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN,
          ACTION_DATA_VIEWER_GROUPING_CLEAR,
          ACTION_DATA_VIEWER_GROUPING_CONFIGURE,
          ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES,
        ];
      },
    });
  }

  private registerPresentation(): void {
    this.dataPresentationService.add({
      id: 'grouping-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'plugin_data_viewer_result_set_grouping_title',
      icon: '/icons/plugin_data_viewer_result_set_grouping_m.svg',
      dataFormat: ResultDataFormat.Resultset,
      hidden: (dataFormat, model, resultIndex) => {
        const source = model.source as any;
        if (!isResultSetDataSource(source) || !source.hasResult(resultIndex)) {
          return true;
        }

        const data = source.getActionImplementation(resultIndex, DatabaseDataResultAction);
        return data?.empty ?? true;
      },
      getPresentationComponent: () => DVResultSetGroupingPresentation,
    });
  }
}
