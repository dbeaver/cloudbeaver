/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap, EDeferredState } from '@cloudbeaver/core-utils';
import { DatabaseDataAccessMode, DataModelWrapper, fetchingSettings, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type {
  IQueryTabGroup, ISqlEditorTabState, ISqlQueryParams, IResultDataTab
} from '../ISqlEditorTabState';
import { QueryDataSource } from '../QueryDataSource';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlExecutionState } from '../SqlExecutionState';

@injectable()
export class SqlResultTabsService {
  private tabExecutionContext: MetadataMap<string, SqlExecutionState>;

  constructor(
    private sqlDialectInfoService: SqlDialectInfoService,
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
  ) {
    this.tabExecutionContext = new MetadataMap(() => new SqlExecutionState());
  }

  getTabExecutionContext(tabId: string): SqlExecutionState {
    return this.tabExecutionContext.get(tabId);
  }

  async executeEditorQuery(
    tabId: string,
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    if (!query.trim()) {
      return;
    }

    if (!editorState.contextId) {
      console.error('executeEditorQuery contextId is not provided');
      return;
    }

    if (!editorState.connectionId) {
      console.error('executeEditorQuery connectionId is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: DataModelWrapper;
    let tabGroup: IQueryTabGroup;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(editorState.connectionId);
    const currentTab = editorState.resultTabs.find(tab => tab.resultTabId === editorState.currentResultTabId);

    const sqlQueryParams: ISqlQueryParams = {
      connectionId: editorState.connectionId,
      objectCatalogId: editorState.objectCatalogId,
      objectSchemaId: editorState.objectSchemaId,
      contextId: editorState.contextId,
      query: await this.getSubQuery(editorState.connectionId, query),
    };

    if (inNewTab || !currentTab?.groupId) {
      source = new QueryDataSource(this.graphQLService, this.notificationService, this);
      model = this.tableViewerStorageService.create(source)
        .setCountGain()
        .setSlice(0);

      tabGroup = this.createGroup(sqlQueryParams, editorState, model.id);

      isNewTabCreated = true;
    } else {
      tabGroup = editorState.queryTabGroups.find(group => group.groupId === currentTab.groupId)!;
      tabGroup.sqlQueryParams = sqlQueryParams;
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as any as QueryDataSource;
    }

    model
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    source.setOptions({
      tabId: tabId,
      group: tabGroup,
      connectionId: sqlQueryParams.connectionId,
      sourceName: sqlQueryParams.query,
      constraints: [],
      whereFilter: '',
    })
      .setExecutionContext(sqlQueryParams)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    for (let [i, length] = [0, 1]; i < length; i++) {
      let resultTab = editorState.resultTabs.find(
        resultTab => resultTab.groupId === tabGroup.groupId
          && resultTab.indexInResultSet === i
      );

      if (!resultTab) {
        const order = findMinimalFree(
          editorState.resultTabs
            .filter(resultTab => resultTab.groupId === tabGroup.groupId)
            .map(result => result.order),
          1
        );
        resultTab = this.createResultTab(order, tabGroup.groupId, tabGroup.order, i);

        // we get mobx observed value here, so we can mutate name late
        resultTab = editorState.resultTabs[editorState.resultTabs.push(resultTab) - 1];
      }

      if (i === 0) {
        editorState.currentResultTabId = resultTab.resultTabId;

        try {
          await model
            .setSlice(0, fetchingSettings.fetchDefault)
            .requestData();

          length = model.results.length;

          if (length === 1) {
            resultTab.name = this.getTabNameForOrder(tabGroup.order);
          } else {
            resultTab.name = this.getTabNameForOrder(tabGroup.order, resultTab.order);
          }

          editorState.resultTabs = editorState.resultTabs
            .filter(
              resultTab => resultTab.groupId !== tabGroup.groupId
              || resultTab.indexInResultSet < length
            );
        } catch (exception) {
          // remove first panel if execution was cancelled
          if (source.queryExecutionProcess?.getState() === EDeferredState.CANCELLED && isNewTabCreated) {
            this.removeGroup(editorState, tabGroup.groupId);
            const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
            this.notificationService.logException(exception, 'Query execution Error', message);
          }
        }
      }
    }
  }

  createGroup(
    params: ISqlQueryParams,
    tabState: ISqlEditorTabState,
    modelId: string
  ): IQueryTabGroup {
    const order = findMinimalFree(
      tabState.queryTabGroups.map(group => group.order),
      1
    );

    const tabGroup: IQueryTabGroup = {
      groupId: uuid(),
      modelId,
      order,
      sqlQueryParams: params,
    };
    tabState.queryTabGroups.push(tabGroup);

    return tabState.queryTabGroups.find(group => group.groupId === tabGroup.groupId)!;
  }

  async getSubQuery(connectionId: string, query: string): Promise<string> {
    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      return query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    return query;
  }

  removeGroup(tabState: ISqlEditorTabState, groupId: string): void {
    tabState.queryTabGroups = tabState.queryTabGroups.filter(group => group.groupId !== groupId);
    tabState.resultTabs = tabState.resultTabs.filter(tab => tab.groupId !== groupId);
    tabState.currentResultTabId = tabState.resultTabs[0]?.resultTabId;
  }

  private createResultTab(
    order: number,
    groupId: string,
    groupOrder: number,
    indexInResultSet: number
  ): IResultDataTab {
    return {
      resultTabId: uuid(),
      groupId,
      order,
      name: this.getTabNameForOrder(groupOrder, indexInResultSet === 0 ? undefined : order),
      indexInResultSet,
    };
  }

  private getTabNameForOrder(groupOrder: number, order?: number) {
    return `Result - ${groupOrder}` + (order !== undefined ? ` (${order})` : '');
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
