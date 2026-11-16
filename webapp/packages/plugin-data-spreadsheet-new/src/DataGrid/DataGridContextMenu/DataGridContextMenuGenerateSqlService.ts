/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { SqlResultSetGeneratorId, type SqlQueryGeneratorOptions, type SqlResultRow } from '@cloudbeaver/core-sdk';
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
  type IDataContainerOptions,
  type IGridColumnKey,
  type IGridDataKey,
  type IGridRowKey,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { DDL_GENERATOR_ID, getDefaultQueryGeneratorOptions, SqlGenerationService, SqlGeneratorsResource } from '@cloudbeaver/plugin-sql-generator';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { ACTION_DATA_GRID_GENERATE_SQL_CREATE } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_CREATE.js';
import { ACTION_DATA_GRID_GENERATE_SQL_DELETE } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_DELETE.js';
import { ACTION_DATA_GRID_GENERATE_SQL_INSERT } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_INSERT.js';
import { ACTION_DATA_GRID_GENERATE_SQL_SELECT } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_SELECT.js';
import { ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_SELECT_MANY.js';
import { ACTION_DATA_GRID_GENERATE_SQL_UPDATE } from '../Actions/GenerateSQL/ACTION_DATA_GRID_GENERATE_SQL_UPDATE.js';
import { MENU_DATA_GRID_GENERATE_SQL } from './GenerateSQL/MENU_DATA_GRID_GENERATE_SQL.js';

export class DataGridContextMenuGenerateSqlServiceImpl {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlGenerationService: SqlGenerationService,
    private readonly notificationService: NotificationService,
    private readonly sqlGeneratorsResource: SqlGeneratorsResource,
    private readonly localizationService: LocalizationService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
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
        ACTION_DATA_GRID_GENERATE_SQL_CREATE,
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
        ACTION_DATA_GRID_GENERATE_SQL_CREATE,
      ],
      isDisabled: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;

        return model.isLoading();
      },
      handler: async (context, action) => {
        if (action === ACTION_DATA_GRID_GENERATE_SQL_CREATE) {
          await this.openEntitySqlDialog(context);
          return;
        }

        await this.openSqlDialog(context, mapGeneratorIdFromAction(action), action.info.label);
      },
    });
  }

  private async openSqlDialog(context: IDataContextProvider, generatorId: SqlResultSetGeneratorId, generatorLabel: string): Promise<void> {
    const model = context.get(DATA_CONTEXT_DV_DDM)!;
    const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
    const key = context.get(DATA_CONTEXT_DV_RESULT_KEY);
    const options = model.source.options as IDataContainerOptions | undefined;
    const containerNodePath = options?.containerNodePath;

    if (!isResultSetDataModel(model)) {
      return;
    }

    const nodePath = options?.containerNodePath;
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
      const query = await this.generateQuery({
        projectId,
        connectionId,
        contextId,
        resultId,
        generatorId,
        rows,
        options: getDefaultQueryGeneratorOptions(),
      });

      if (!query) {
        return;
      }

      await this.sqlGenerationService.openDialog({
        query,
        nodeId: nodePath ?? connectionId,
        nodeName: this.getEntityNameFromNodePath(containerNodePath, model.name),
        generatorId,
        generatorName: this.localizationService.translate(generatorLabel),
        options: getDefaultQueryGeneratorOptions(),
        regenerateQuery: options =>
          this.generateQuery({
            projectId,
            connectionId,
            contextId,
            resultId,
            generatorId,
            rows,
            options,
          }),
      });
    } catch (e: any) {
      this.notificationService.logException(e, 'data_grid_table_generate_sql_error_title');
    }
  }

  private async openEntitySqlDialog(context: IDataContextProvider): Promise<void> {
    const model = context.get(DATA_CONTEXT_DV_DDM)!;
    const options = model.source.options as IDataContainerOptions | undefined;
    const nodePathList = options?.containerNodePath;

    if (!isResultSetDataModel(model)) {
      return;
    }

    const connectionId = model.source.executionContext?.context?.connectionId;

    if (!nodePathList || !isNotNullDefined(connectionId)) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_no_connection',
      });

      return;
    }

    try {
      const generators = await this.sqlGeneratorsResource.load({ nodeIds: [nodePathList] });
      const createGenerator = generators.find(g => g.id.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase()));

      if (!createGenerator) {
        this.notificationService.logInfo({
          title: 'data_grid_table_generate_sql_error_title',
          message: 'data_grid_table_generate_sql_ddl_no_support',
        });

        return;
      }

      const query = await this.sqlGeneratorsResource.generateEntityQuery(createGenerator.id, nodePathList, getDefaultQueryGeneratorOptions());

      await this.sqlGenerationService.openDialog({
        query,
        nodeId: nodePathList,
        nodeName: this.getEntityNameFromNodePath(nodePathList, model.name),
        generatorId: createGenerator.id,
        generatorName: createGenerator.label,
        options: getDefaultQueryGeneratorOptions(),
        regenerateQuery: genOptions => this.sqlGeneratorsResource.generateEntityQuery(createGenerator.id, nodePathList, genOptions),
      });
    } catch (e: any) {
      this.notificationService.logException(e, 'data_grid_table_generate_sql_error_title');
    }
  }

  private async generateQuery({
    projectId,
    connectionId,
    contextId,
    resultId,
    generatorId,
    rows,
    options,
  }: {
    projectId: string;
    connectionId: string;
    contextId: string;
    resultId: string;
    generatorId: SqlResultSetGeneratorId;
    rows: SqlResultRow[];
    options: SqlQueryGeneratorOptions;
  }): Promise<string> {
    const query = await this.sqlGeneratorsResource.generateResultSetSql({
      projectId,
      connectionId,
      contextId,
      resultsId: resultId,
      generatorId,
      selectedRows: rows,
      generatorOptions: options,
    });

    if (!query) {
      throw new Error('data_grid_table_generate_sql_error_no_query');
    }

    return query;
  }

  private getEntityNameFromNodePath(nodePath: string | undefined, fallbackName?: string | null): string | undefined {
    if (nodePath) {
      const name = this.navNodeInfoResource.get(nodePath)?.name;

      if (name) {
        return name;
      }
    }

    return fallbackName ?? undefined;
  }
}

export type DataGridContextMenuGenerateSqlService = DataGridContextMenuGenerateSqlServiceImpl;

export class DataGridContextMenuGenerateSqlServiceDI extends Context.Service<
  DataGridContextMenuGenerateSqlServiceDI,
  DataGridContextMenuGenerateSqlServiceImpl
>()(
  '@cloudbeaver/plugin-data-spreadsheet-new/DataGrid/DataGridContextMenu/DataGridContextMenuGenerateSqlService#DataGridContextMenuGenerateSqlService',
) {
  static readonly implementation = DataGridContextMenuGenerateSqlServiceImpl;

  static readonly dependencies = () =>
    [ActionService, MenuService, SqlGenerationService, NotificationService, SqlGeneratorsResource, LocalizationService, NavNodeInfoResource] as const;
  static readonly make: Effect.Effect<
    DataGridContextMenuGenerateSqlServiceImpl,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof SqlGenerationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SqlGeneratorsResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Effect.gen(function* makeDataGridContextMenuGenerateSqlService() {
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;
    const sqlGenerationService = yield* SqlGenerationService;
    const notificationService = yield* NotificationService;
    const sqlGeneratorsResource = yield* SqlGeneratorsResource;
    const localizationService = yield* LocalizationService;
    const navNodeInfoResource = yield* NavNodeInfoResource;

    return new DataGridContextMenuGenerateSqlServiceImpl(
      actionService,
      menuService,
      sqlGenerationService,
      notificationService,
      sqlGeneratorsResource,
      localizationService,
      navNodeInfoResource,
    );
  });
  static readonly layer: Layer.Layer<
    DataGridContextMenuGenerateSqlServiceDI,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof SqlGenerationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SqlGeneratorsResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataGridContextMenuGenerateSqlService = DataGridContextMenuGenerateSqlServiceDI;

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
