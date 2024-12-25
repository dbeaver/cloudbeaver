/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { ConnectionExecutionContextService, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import {
  DatabaseDataAccessMode,
  DatabaseDataModel,
  DatabaseEditAction,
  DataViewerDataChangeConfirmationService,
  DataViewerService,
  DataViewerSettingsService,
  type IDatabaseDataModel,
  TableViewerStorageService,
} from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { QueryDataSource } from '../QueryDataSource.js';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService.js';
import { SqlQueryResultService } from './SqlQueryResultService.js';

interface IQueryExecutionOptions {
  onQueryExecutionStart?: (query: string, index: number) => void;
  onQueryExecuted?: (query: string, index: number, success: boolean) => void;
}

export interface IQueryExecutionStatistics {
  queries: number;
  executedQueries: number;
  updatedRows: number;
  executeTime: number;
  modelId: string | null;
}

@injectable()
export class SqlQueryService {
  private readonly statisticsMap: Map<string, IQueryExecutionStatistics>;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly sqlQueryResultService: SqlQueryResultService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly dataViewerDataChangeConfirmationService: DataViewerDataChangeConfirmationService,
    private readonly dataViewerService: DataViewerService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly dataViewerSettingsService: DataViewerSettingsService,
  ) {
    this.statisticsMap = new Map();

    makeObservable<this, 'statisticsMap'>(this, {
      statisticsMap: observable,
    });
  }

  getStatistics(tabId: string): IQueryExecutionStatistics | undefined {
    return this.statisticsMap.get(tabId);
  }

  initDatabaseDataModels(editorState: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);
    const databaseModels = dataSource?.databaseModels;

    if (!databaseModels) {
      return;
    }

    const groups = this.sqlQueryResultService.getGroups(editorState).filter(group => !databaseModels.some(model => model.id === group.modelId));

    for (const group of groups) {
      this.sqlQueryResultService.removeGroup(editorState, group.groupId);
    }

    let first = true;
    for (const model of databaseModels) {
      this.tableViewerStorageService.add(model);
      this.dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

      let tabGroup = this.sqlQueryResultService.getModelGroup(editorState, model.id);
      if (!tabGroup) {
        tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, model.source.options?.query ?? '');

        this.switchTabToActiveRequest(editorState, tabGroup, model);
        this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, first);

        model.onRequest.addHandler(({ stage, model }) => {
          if (stage === 'after') {
            const tabGroup = this.sqlQueryResultService.getModelGroup(editorState, model.id);

            if (tabGroup) {
              this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);
            }
          }
        });
        first = false;
      }
    }
  }

  async executeEditorQuery(editorState: ISqlEditorTabState, query: string, inNewTab: boolean): Promise<void> {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);
    const contextInfo = dataSource?.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.id);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: IDatabaseDataModel<QueryDataSource>;
    let isNewTabCreated = false;

    const connectionKey = createConnectionParam(contextInfo.projectId, contextInfo.connectionId);

    const connectionInfo = await this.connectionInfoResource.load(connectionKey);
    let tabGroup = this.sqlQueryResultService.getSelectedGroup(editorState);

    if (inNewTab || !tabGroup) {
      source = new QueryDataSource(this.serviceProvider, this.graphQLService, this.asyncTaskInfoService);
      model = this.tableViewerStorageService.add(new DatabaseDataModel(source));
      this.dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);
      tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
      this.switchTabToActiveRequest(editorState, tabGroup, model);

      isNewTabCreated = true;
    } else {
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as QueryDataSource;
      tabGroup.query = query;
    }

    const editable = this.dataViewerService.isDataEditable(connectionInfo);
    const isOutputLogsTabOpened = !!editorState.outputLogsTab;

    model
      .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly)
      .source.setExecutionContext(executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats)
      .setKeepExecutionContextOnDispose(true)
      .setOptions({
        query: query,
        connectionKey,
        constraints: [],
        whereFilter: '',
        readLogs: isOutputLogsTabOpened,
      });

    this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, true);

    try {
      await model.setCountGain(this.dataViewerSettingsService.getDefaultRowsCount()).setSlice(0).request();

      model.setName(this.sqlQueryResultService.getTabNameForOrder(tabGroup.nameOrder, 0, model.source.getResults().length));
      this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);
    } catch (exception: any) {
      // remove group if execution was cancelled
      if (source.currentTask?.cancelled && isNewTabCreated) {
        this.sqlQueryResultService.removeGroup(editorState, tabGroup.groupId);
        const message = 'Query execution has been canceled';
        this.notificationService.logException(exception, 'Query execution Error', message);
        return;
      }
      throw exception;
    }
  }

  async executeQueries(editorState: ISqlEditorTabState, queries: string[], options?: IQueryExecutionOptions): Promise<void> {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);
    const contextInfo = dataSource?.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.id);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const groupNameOrder = this.sqlQueryResultService.getGroupNameOrder(editorState);
    const connectionKey = createConnectionParam(contextInfo.projectId, contextInfo.connectionId);

    const connectionInfo = await this.connectionInfoResource.load(connectionKey);

    const statisticsTab = this.sqlQueryResultService.createStatisticsTab(editorState);

    this.statisticsMap.set(statisticsTab.tabId, {
      queries: queries.length,
      executedQueries: 0,
      executeTime: 0,
      updatedRows: 0,
      modelId: null,
    });

    editorState.currentTabId = statisticsTab.tabId;

    const statistics = this.getStatistics(statisticsTab.tabId)!;

    let source: QueryDataSource | undefined;
    let model: IDatabaseDataModel<QueryDataSource> | undefined;
    let resultCount = 0;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]!;

      options?.onQueryExecutionStart?.(query, i);

      if (!model || !source) {
        source = new QueryDataSource(this.serviceProvider, this.graphQLService, this.asyncTaskInfoService);
        model = this.tableViewerStorageService.add(new DatabaseDataModel(source));
        this.dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);
      }
      statistics.modelId = model.id;

      const editable = this.dataViewerService.isDataEditable(connectionInfo);
      const isOutputLogsTabOpened = !!editorState.outputLogsTab;

      model
        .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly)
        .source.setExecutionContext(executionContext)
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
        .setKeepExecutionContextOnDispose(true)
        .setOptions({
          query,
          connectionKey,
          constraints: [],
          whereFilter: '',
          readLogs: isOutputLogsTabOpened,
        });

      try {
        await model.setCountGain(this.dataViewerSettingsService.getDefaultRowsCount()).setSlice(0).request();

        const cancelled = model.source.cancelled;

        statistics.executedQueries++;
        statistics.executeTime += source.requestInfo.requestDuration;

        for (const result of source.results) {
          statistics.updatedRows += result.updateRowCount;
        }

        if (source.results.some(result => result.data)) {
          resultCount = resultCount + 1;

          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query, groupNameOrder);
          model.setName(this.sqlQueryResultService.getTabNameForOrder(tabGroup.nameOrder, 0, model.source.getResults().length, resultCount));
          this.switchTabToActiveRequest(editorState, tabGroup, model);

          this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, false, resultCount);

          model = source = undefined;
        }

        options?.onQueryExecuted?.(query, i, true);

        if (cancelled) {
          break;
        }
      } catch (exception: any) {
        if (model) {
          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
          this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, true, resultCount);

          model = source = undefined;
        }
        options?.onQueryExecuted?.(query, i, false);
        break;
      }
    }

    statistics.modelId = null;

    if (model) {
      this.tableViewerStorageService.remove(model.id);
    }
  }

  removeStatisticsTab(state: ISqlEditorTabState, tabId: string): void {
    this.sqlQueryResultService.removeStatisticsTab(state, tabId);
    this.statisticsMap.delete(tabId);
  }

  private switchTabToActiveRequest(editorState: ISqlEditorTabState, tabGroup: IResultGroup, model: IDatabaseDataModel<QueryDataSource>) {
    model.onRequest.addPostHandler(({ stage }) => {
      if (stage === 'request') {
        const activeGroupId = this.sqlQueryResultService.getSelectedGroup(editorState)?.groupId;
        for (const result of model.source.getResults()) {
          const editor = model.source.getActionImplementation(result, DatabaseEditAction);

          const edited = editor?.isEdited() && model.source.executionContext?.context;

          if (edited && activeGroupId !== tabGroup.groupId) {
            this.sqlQueryResultService.selectResult(editorState, tabGroup.groupId, model.source.getResults().indexOf(result));
            return;
          }
        }
      }
    });
  }
}
