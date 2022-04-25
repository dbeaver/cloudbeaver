/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { QuotasService } from '@cloudbeaver/core-app';
import { ConnectionExecutionContextService, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { App, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import {
  DatabaseDataAccessMode, DatabaseDataModel, DatabaseEditAction, DataViewerDataChangeConfirmationService,
  getDefaultRowsCount, IDatabaseDataModel, IDatabaseResultSet, DataViewerService, TableViewerStorageService
} from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, ISqlEditorTabState } from '../ISqlEditorTabState';
import { IDataQueryOptions, QueryDataSource } from '../QueryDataSource';
import { SqlQueryResultService } from './SqlQueryResultService';

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
    private readonly app: App,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly sqlQueryResultService: SqlQueryResultService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly dataViewerDataChangeConfirmationService: DataViewerDataChangeConfirmationService,
    private readonly dataViewerService: DataViewerService,
    private readonly quotasService: QuotasService
  ) {
    this.statisticsMap = new Map();

    makeObservable<this, 'statisticsMap'>(this, {
      statisticsMap: observable,
    });
  }

  getStatistics(tabId: string): IQueryExecutionStatistics | undefined {
    return this.statisticsMap.get(tabId);
  }

  async executeEditorQuery(
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    const contextInfo = editorState.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.id);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(contextInfo.connectionId);
    let tabGroup = this.sqlQueryResultService.getSelectedGroup(editorState);

    if (inNewTab || !tabGroup) {
      source = new QueryDataSource(
        this.app.getServiceInjector(),
        this.graphQLService,
        this.asyncTaskInfoService,
        this.quotasService
      );
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
    model
      .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly)
      .setOptions({
        query: query,
        connectionId: contextInfo.connectionId,
        constraints: [],
        whereFilter: '',
      })
      .source
      .setExecutionContext(executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, true);

    try {
      await model
        .setCountGain(getDefaultRowsCount())
        .setSlice(0)
        .request();

      model.setName(this.sqlQueryResultService.getTabNameForOrder(
        tabGroup.nameOrder,
        0,
        model.getResults().length
      ));
      this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);
    } catch (exception: any) {
      // remove group if execution was cancelled
      if (source.currentTask?.cancelled && isNewTabCreated) {
        this.sqlQueryResultService.removeGroup(editorState, tabGroup.groupId);
        const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
        this.notificationService.logException(exception, 'Query execution Error', message);
        return;
      }
      throw exception;
    }
  }

  async executeQueries(
    editorState: ISqlEditorTabState,
    queries: string[],
    options?: IQueryExecutionOptions
  ): Promise<void> {
    const contextInfo = editorState.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.id);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const connectionInfo = await this.connectionInfoResource.load(contextInfo.connectionId);

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
    let model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet> | undefined;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      options?.onQueryExecutionStart?.(query, i);

      if (!model || !source) {
        source = new QueryDataSource(
          this.app.getServiceInjector(),
          this.graphQLService,
          this.asyncTaskInfoService,
          this.quotasService
        );
        model = this.tableViewerStorageService.add(new DatabaseDataModel(source));
        this.dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);
      }
      statistics.modelId = model.id;

      const editable = this.dataViewerService.isDataEditable(connectionInfo);
      model
        .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly)
        .setOptions({
          query: query,
          connectionId: contextInfo.connectionId,
          constraints: [],
          whereFilter: '',
        })
        .source
        .setExecutionContext(executionContext)
        .setSupportedDataFormats(connectionInfo.supportedDataFormats);

      try {
        await model
          .setCountGain(getDefaultRowsCount())
          .setSlice(0)
          .request();

        statistics.executedQueries++;
        statistics.executeTime += source.requestInfo.requestDuration;

        for (const result of source.results) {
          statistics.updatedRows += result.updateRowCount;
        }

        if (source.results.some(result => result.data)) {
          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
          model.setName(this.sqlQueryResultService.getTabNameForOrder(
            tabGroup.nameOrder,
            0,
            model.getResults().length,
            statisticsTab.order,
            i + 1
          ));
          this.switchTabToActiveRequest(editorState, tabGroup, model);
          this.sqlQueryResultService.updateGroupTabs(
            editorState,
            model,
            tabGroup.groupId,
            false,
            statisticsTab.order,
            i + 1
          );

          model = source = undefined;
        }
        options?.onQueryExecuted?.(query, i, true);
      } catch (exception: any) {
        if (model) {
          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
          this.sqlQueryResultService.updateGroupTabs(
            editorState,
            model,
            tabGroup.groupId,
            true,
            statisticsTab.order,
            i + 1
          );

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

  private switchTabToActiveRequest(
    editorState: ISqlEditorTabState,
    tabGroup: IResultGroup,
    model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>
  ) {
    model.onRequest.addPostHandler(({ type }) => {
      if (type === 'on') {
        const edited = model
          .getResults()
          .some((r, index) => {
            const editor = model.source.getActionImplementation(
              index,
              DatabaseEditAction
            );

            return editor?.isEdited() && model.source.executionContext?.context;
          });

        if (edited && this.sqlQueryResultService.getSelectedGroup(editorState)?.groupId !== tabGroup.groupId) {
          this.sqlQueryResultService.selectFirstResult(editorState, tabGroup.groupId);
        }
      }
    });
  }
}
