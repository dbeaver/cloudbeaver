/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';

import { DatabaseMetadataAction } from '../DatabaseDataModel/Actions/DatabaseMetadataAction';
import { ResultSetConstraintAction } from '../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import { DATA_CONTEXT_DV_DDM } from '../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from '../TableViewer/TableFooter/TableFooterMenu/DATA_VIEWER_DATA_MODEL_ACTIONS_MENU';
import { ACTION_COUNT_TOTAL_ELEMENTS } from './ACTION_COUNT_TOTAL_ELEMENTS';

interface IResultSetActionsMetadata {
  totalCount: {
    loading: boolean;
  };
}

@injectable()
export class ResultSetTableFooterMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly notificationService: NotificationService,
  ) {}

  register() {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const result = model.getResult(resultIndex);

        return !!result && result.dataFormat === ResultDataFormat.Resultset;
      },
      getItems(context, items) {
        return [ACTION_COUNT_TOTAL_ELEMENTS, ...items];
      },
      orderItems(context, items) {
        const extracted = menuExtractItems(items, [ACTION_COUNT_TOTAL_ELEMENTS]);
        return [...extracted, ...items];
      },
    });
    this.actionService.addHandler({
      id: 'result-set-data-base-handler',
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      actions: [ACTION_COUNT_TOTAL_ELEMENTS],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isActionApplicable(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const result = model.getResult(resultIndex);

        if (!result || result?.dataFormat !== ResultDataFormat.Resultset) {
          return false;
        }
        const constraint = model.source.tryGetAction(resultIndex, ResultSetConstraintAction);

        switch (action) {
          case ACTION_COUNT_TOTAL_ELEMENTS: {
            return !!constraint?.supported;
          }
        }
        return true;
      },
      isDisabled: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (model.isLoading() || model.isDisabled(resultIndex) || !model.getResult(resultIndex)) {
          return true;
        }

        switch (action) {
          case ACTION_COUNT_TOTAL_ELEMENTS: {
            const metadata = this.getState(context);

            return metadata.totalCount.loading && Boolean(model.source.totalCountRequestTask?.cancelled);
          }
        }

        return false;
      },
      isLoading: (context, action) => {
        const metadata = this.getState(context);

        switch (action) {
          case ACTION_COUNT_TOTAL_ELEMENTS: {
            return metadata.totalCount.loading;
          }
        }

        return false;
      },
      getActionInfo: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const metadata = this.getState(context);

        switch (action) {
          case ACTION_COUNT_TOTAL_ELEMENTS: {
            const result = model.getResult(resultIndex);
            if (!result) {
              return action.info;
            }

            let label = action.info.label;
            let icon = action.info.icon;

            if (metadata.totalCount.loading) {
              const cancelling = Boolean(model.source.totalCountRequestTask?.cancelled);
              label = cancelling ? 'ui_processing_canceling' : 'ui_processing_cancel';
              icon = 'cross';
            } else {
              const currentCount = result.loadedFully ? result.count : `${result.count}+`;
              label = String(result.totalCount ?? currentCount);
            }

            return { ...action.info, label, icon };
          }
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const metadata = this.getState(context);

        switch (action) {
          case ACTION_COUNT_TOTAL_ELEMENTS: {
            if (metadata.totalCount.loading) {
              if (model.source.totalCountRequestTask?.cancelled) {
                // Cancel request
                return;
              }

              try {
                await model.source.cancelLoadTotalCount();
              } catch (e: any) {
                if (!model.source.totalCountRequestTask?.cancelled) {
                  this.notificationService.logException(e);
                }
              }
            } else {
              try {
                metadata.totalCount.loading = true;
                await model.source.loadTotalCount(resultIndex);
              } catch (exception: any) {
                if (model.source.totalCountRequestTask?.cancelled) {
                  this.notificationService.logInfo({
                    title: 'data_viewer_total_count_canceled_title',
                    message: 'data_viewer_total_count_canceled_message',
                  });
                } else {
                  this.notificationService.logException(exception, 'data_viewer_total_count_failed');
                }
              } finally {
                metadata.totalCount.loading = false;
              }
            }
            break;
          }
        }
      },
    });
  }

  private getState(context: IDataContextProvider) {
    const model = context.get(DATA_CONTEXT_DV_DDM)!;
    const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
    const metadataAction = model.source.getAction(resultIndex, DatabaseMetadataAction);
    return metadataAction.get<IResultSetActionsMetadata>('result-set-database-metadata', () => ({ totalCount: { loading: false } }));
  }
}
