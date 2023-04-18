/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_VIEWER_DATA_MODEL_ACTIONS_MENU, DataPresentationService, DataPresentationType, ResultSetDataAction, ResultSetSelectAction, ResultSetViewAction } from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_VIEWER_GROUPING_CLEAR } from './Actions/ACTION_DATA_VIEWER_GROUPING_CLEAR';
import { ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN } from './Actions/ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN';
import { DATA_CONTEXT_DV_DDM_RS_GROUPING } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING';
import { DVResultSetGroupingPresentation } from './DVResultSetGroupingPresentation';

@injectable()
export class DVResultSetGroupingPluginBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService
  ) {
    super();
  }

  register(): void {
    this.registerPresentation();
    this.registerActions();
  }

  load(): void | Promise<void> { }

  private registerActions(): void {
    this.actionService.addHandler({
      id: 'data-viewer-grouping-menu-base-handler',
      isActionApplicable(context, action) {
        const menu = context.hasValue(DATA_CONTEXT_MENU, DATA_VIEWER_DATA_MODEL_ACTIONS_MENU);

        if (!menu || !context.has(DATA_CONTEXT_DV_DDM_RS_GROUPING)) {
          return false;
        }

        return [ACTION_DATA_VIEWER_GROUPING_CLEAR, ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN].includes(action);
      },
      isDisabled(context, action) {
        const grouping = context.get(DATA_CONTEXT_DV_DDM_RS_GROUPING);
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        switch (action) {
          case ACTION_DATA_VIEWER_GROUPING_CLEAR:
            return grouping.getColumns().length === 0;
          case ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN: {
            if (!model.source.hasResult(resultIndex)) {
              return true;
            }
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
        }

        return false;
      },
      handler: (context, action) => {
        const grouping = context.get(DATA_CONTEXT_DV_DDM_RS_GROUPING);
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);

        switch (action) {
          case ACTION_DATA_VIEWER_GROUPING_CLEAR:
            grouping.clear();
            break;
          case ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN: {
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
          }
        }
      },
    });
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      isApplicable(context) {
        return context.has(DATA_CONTEXT_DV_DDM_RS_GROUPING);
      },
      getItems(context, items) {
        return [
          ...items,
          ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN,
          ACTION_DATA_VIEWER_GROUPING_CLEAR,
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
      hidden: (
        dataFormat,
        model,
        resultIndex
      ) => {
        if (!model.source.hasResult(resultIndex)) {
          return true;
        }

        const data = model.source.tryGetAction(resultIndex, ResultSetDataAction);
        return data?.empty ?? true;
      },
      getPresentationComponent: () => DVResultSetGroupingPresentation,
    });
  }

}