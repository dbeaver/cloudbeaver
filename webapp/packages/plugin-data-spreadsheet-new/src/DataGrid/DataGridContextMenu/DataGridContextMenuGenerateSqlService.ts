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
  GridSelectAction,
  IDatabaseDataSelectAction,
  isDataEditorSource,
  isResultSetDataModel,
  ResultSetDataAction,
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
import { executeAsyncSilently } from '@cloudbeaver/core-utils';

const MAX_ROWS_FOR_SQL_GENERATION = 1000;

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
    // Add "Generate SQL" submenu to context menu
    this.menuService.addCreator({
      root: true,
      menus: [],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        // Only show for result sets, not for data editor (ContainerDataSource)
        return isResultSetDataModel(model) && !isDataEditorSource(model.source);
      },
      getItems: (context, items) => [...items, MENU_DATA_GRID_GENERATE_SQL],
    });

    // Add submenu items (all 5 generator types)
    this.menuService.addCreator({
      menus: [MENU_DATA_GRID_GENERATE_SQL],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM);
        // Only show for result sets, not for data editor (ContainerDataSource)
        return isResultSetDataModel(model) && !isDataEditorSource(model.source);
      },
      getItems: () => [
        ACTION_DATA_GRID_GENERATE_SQL_INSERT,
        ACTION_DATA_GRID_GENERATE_SQL_UPDATE,
        ACTION_DATA_GRID_GENERATE_SQL_DELETE,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT,
        ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY,
      ],
    });

    // Handle all SQL generation actions
    this.actionService.addHandler({
      id: 'data-grid-generate-sql-handler',
      menus: [MENU_DATA_GRID_GENERATE_SQL],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isActionApplicable: (context, action) =>
        [
          ACTION_DATA_GRID_GENERATE_SQL_INSERT,
          ACTION_DATA_GRID_GENERATE_SQL_UPDATE,
          ACTION_DATA_GRID_GENERATE_SQL_DELETE,
          ACTION_DATA_GRID_GENERATE_SQL_SELECT,
          ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY,
        ].includes(action),
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

    // Get selected rows or current row
    const select = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction, GridSelectAction);
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const projectId = model.source.executionContext?.context?.projectId;
    const connectionId = model.source.executionContext?.context?.connectionId;
    const contextId = model.source.executionContext?.context?.id;
    const resultId = model.source.getResult(resultIndex)?.id;

    // Extract unique row keys from selected elements (which are IGridDataKey with { row, column })
    const selectedElements = select?.getSelectedElements() || [];
    const rowKeysSet = new Map<string, IGridRowKey>();
    for (const element of selectedElements) {
      const rowKey = element.row;
      const serialized = `${rowKey.index}:${rowKey.subIndex}`;
      if (!rowKeysSet.has(serialized)) {
        rowKeysSet.set(serialized, rowKey);
      }
    }
    let rowKeys: IGridRowKey[] = Array.from(rowKeysSet.values());

    if (rowKeys.length === 0 && key) {
      rowKeys = [key.row];
    }

    // Check row limit
    if (rowKeys.length > MAX_ROWS_FOR_SQL_GENERATION) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_too_many_rows',
        isSilent: false,
      });
      return;
    }

    // Convert to SqlResultRow format
    const rows: SqlResultRow[] = [];
    for (const rowKey of rowKeys) {
      const rowValue = data.getRowValue(rowKey);
      const rowMetadata = data.getRowMetadata(rowKey);
      if (rowValue) {
        rows.push({
          data: rowValue,
          metaData: rowMetadata,
        });
      }
    }

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

    const { result, error } = await executeAsyncSilently(() =>
      this.sqlGenerationResource.generateResultSetSql({
        projectId,
        connectionId,
        contextId,
        resultsId: resultId,
        generatorId,
        selectedRows: rows,
      }),
    );

    await this.commonDialogService.open(GeneratedSqlDialog, {
      query: result ?? '',
      exception: error,
      nodeId: connectionId,
    });
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
    default:
      return SqlResultSetGeneratorId.DataInsert;
  }
}
