/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SqlResultSetGeneratorId, type SqlResultRow } from '@cloudbeaver/core-sdk';
import { ActionService, MenuService, type IAction } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  DatabaseDataFeature,
  GridDataKeysUtils,
  GridSelectAction,
  GridViewAction,
  IDatabaseDataFormatAction,
  IDatabaseDataResult,
  IDatabaseDataSelectAction,
  IDatabaseDataSource,
  isResultSetDataModel,
  ResultSetDataAction,
  type IDatabaseDataModel,
  type IGridColumnKey,
  type IGridDataKey,
  type IGridRowKey,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_DATA_GRID_GENERATE_SQL_DELETE } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_DELETE.js';
import { ACTION_DATA_GRID_GENERATE_SQL_INSERT } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_INSERT.js';
import { ACTION_DATA_GRID_GENERATE_SQL_SELECT } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_SELECT.js';
import { ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY.js';
import { ACTION_DATA_GRID_GENERATE_SQL_UPDATE } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_UPDATE.js';
import { MENU_DATA_GRID_GENERATE_SQL } from './GenerateSQL/MENU_DATA_GRID_GENERATE_SQL.js';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { GeneratedSqlDialog, SqlGeneratorsResource } from '@cloudbeaver/plugin-sql-generator';
import { isNotNullDefined } from '@dbeaver/js-helpers';

@injectable(() => [ActionService, MenuService, CommonDialogService, NotificationService, SqlGeneratorsResource])
export class DataGridContextMenuGenerateSqlService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly sqlGenerationResource: SqlGeneratorsResource,
  ) {}

  register(): void {
    this.menuService.addCreator({
      root: true,
      menus: [],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const allowedFeatures = [DatabaseDataFeature.DataEditor, DatabaseDataFeature.QueryResult];

        return (
          !!model &&
          allowedFeatures.some(feature => model.source.hasFeature(feature)) &&
          !model.isDisabled(resultIndex) &&
          !model.isReadonly(resultIndex)
        );
      },
      getItems: (context, items) => [...items, MENU_DATA_GRID_GENERATE_SQL],
    });

    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_GENERATE_SQL],
      getItems: () => [
        ACTION_DATA_GRID_GENERATE_SQL_INSERT,
        ACTION_DATA_GRID_GENERATE_SQL_UPDATE,
        ACTION_DATA_GRID_GENERATE_SQL_DELETE,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY,
      ],
    });

    this.actionService.addHandler({
      id: 'data-grid-generate-sql-handler',
      menus: [MENU_DATA_GRID_GENERATE_SQL],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      actions: [
        ACTION_DATA_GRID_GENERATE_SQL_INSERT,
        ACTION_DATA_GRID_GENERATE_SQL_UPDATE,
        ACTION_DATA_GRID_GENERATE_SQL_DELETE,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY,
      ],
      isDisabled: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;

        return model.isLoading();
      },
      handler: async (context, action) => {
        await this.openSqlDialog(context, mapGeneratorIdFromAction(action));
      },
    });
  }

  private async openSqlDialog(context: IDataContextProvider, generatorId: SqlResultSetGeneratorId): Promise<void> {
    const model = context.get(DATA_CONTEXT_DV_DDM)!;
    const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
    const key = context.get(DATA_CONTEXT_DV_RESULT_KEY);

    if (!isResultSetDataModel(model)) {
      return;
    }

    const select = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction, GridSelectAction);
    const projectId = model.source.executionContext?.context?.projectId;
    const connectionId = model.source.executionContext?.context?.connectionId;
    const contextId = model.source.executionContext?.context?.id;
    const resultId = model.source.getResult(resultIndex)?.id;
    const selectedElements = select?.getSelectedElements() || [];
    const rows = getSqlResultRows(model, resultIndex, selectedElements, key);

    if (rows.length === 0) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_no_rows',
      });
      return;
    }

    if (!isNotNullDefined(projectId) || !isNotNullDefined(connectionId) || !isNotNullDefined(contextId) || !isNotNullDefined(resultId)) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_no_connection',
      });
      return;
    }

    try {
      const query = await this.sqlGenerationResource.generateResultSetSql({
        projectId,
        connectionId,
        contextId,
        resultsId: resultId,
        generatorId,
        selectedRows: rows,
      });

      if (!query) {
        this.notificationService.logError({
          title: 'data_grid_table_generate_sql_error_title',
          message: 'data_grid_table_generate_sql_error_no_query',
        });
        return;
      }

      await this.commonDialogService.open(GeneratedSqlDialog, {
        query,
        nodeId: connectionId,
      });
    } catch (e: any) {
      this.notificationService.logException(e, 'data_grid_table_generate_sql_error_title');
    }
  }
}

function mapGeneratorIdFromAction(action: IAction): SqlResultSetGeneratorId {
  switch (action) {
    case ACTION_DATA_GRID_GENERATE_SQL_INSERT:
      return SqlResultSetGeneratorId.DataInsert;
    case ACTION_DATA_GRID_GENERATE_SQL_UPDATE:
      return SqlResultSetGeneratorId.DataUpdate;
    case ACTION_DATA_GRID_GENERATE_SQL_DELETE:
      return SqlResultSetGeneratorId.DataDeleteByUniqueKey;
    case ACTION_DATA_GRID_GENERATE_SQL_SELECT:
      return SqlResultSetGeneratorId.DataSelect;
    case ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY:
      return SqlResultSetGeneratorId.DataSelectMany;
    default: {
      throw new Error(`Unsupported action for SQL generation: ${action.id}`);
    }
  }
}

function getRowKeys(
  selectedElements: IGridDataKey<IGridRowKey, IGridColumnKey>[],
  key: IGridDataKey<IGridRowKey, IGridColumnKey> | undefined,
): IGridRowKey[] {
  const rowKeysMap = new Map<string, IGridRowKey>(selectedElements.map(element => [GridDataKeysUtils.serialize(element.row), element.row]));
  let rowKeys: IGridRowKey[] = Array.from(rowKeysMap.values());

  if (rowKeys.length === 0 && key) {
    rowKeys = [key.row];
  }

  return rowKeys;
}

function getSqlResultRows(
  model: IDatabaseDataModel<IDatabaseDataSource<unknown, IDatabaseDataResult>>,
  resultIndex: number,
  selectedElements: IGridDataKey<IGridRowKey, IGridColumnKey>[],
  key: IGridDataKey<IGridRowKey, IGridColumnKey> | undefined,
): SqlResultRow[] {
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const format = model.source.getAction(resultIndex, IDatabaseDataFormatAction);
  const view = model.source.getAction(resultIndex, GridViewAction);
  const rowKeys = getRowKeys(selectedElements, key);
  const result: SqlResultRow[] = [];
  const columnKeys = view.columnKeys;

  for (const rowKey of rowKeys) {
    const rowValue = data.getRowValue(rowKey);
    const rowMetadata = data.getRowMetadata(rowKey);

    if (rowValue) {
      result.push({
        data: rowValue.map((value, index) => {
          const columnKey = columnKeys[index];

          if (!columnKey) {
            return value;
          }

          const cellKey: IGridDataKey = { row: rowKey, column: columnKey };
          const holder = format.get(cellKey);
          const text = format.getText(holder);

          return text || null;
        }),
        metaData: rowMetadata,
      });
    }
  }

  return result;
}
