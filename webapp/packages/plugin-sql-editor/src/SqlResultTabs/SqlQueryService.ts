/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid, EDeferredState } from '@cloudbeaver/core-utils';
import { DatabaseDataAccessMode, DataModelWrapper, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type {
  IResultGroup, ISqlEditorTabState, ISqlQueryParams
} from '../ISqlEditorTabState';
import { QueryDataSource } from '../QueryDataSource';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import type { SqlExecutionState } from '../SqlExecutionState';

@injectable()
export class SqlQueryService {
  constructor(
    private sqlDialectInfoService: SqlDialectInfoService,
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
  ) { }

  async executeEditorQuery(
    executionState: SqlExecutionState,
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    if (!query.trim()) {
      return;
    }

    if (!editorState.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: DataModelWrapper;
    let tabGroup: IResultGroup;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(editorState.executionContext.connectionId);
    const currentTab = editorState.tabs.find(tab => tab.id === editorState.currentTabId);
    const resultTab = editorState.resultTabs.find(tab => tab.tabId === currentTab?.id);

    const sqlQueryParams: ISqlQueryParams = {
      executionContext: editorState.executionContext,
      query: await this.getSubQuery(editorState.executionContext.connectionId, query),
    };

    if (inNewTab || !resultTab) {
      source = new QueryDataSource(this.graphQLService, this.notificationService, executionState);
      model = this.tableViewerStorageService.create(source)
        .setCountGain()
        .setSlice(0);

      tabGroup = this.createGroup(sqlQueryParams, editorState, model.id);

      isNewTabCreated = true;
    } else {
      tabGroup = editorState.resultGroups.find(group => group.groupId === resultTab.groupId)!;
      tabGroup.sqlQueryParams = sqlQueryParams;
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as any as QueryDataSource;
    }

    model
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    source.setOptions({
      query: sqlQueryParams.query,
      connectionId: sqlQueryParams.executionContext.connectionId,
      constraints: [],
      whereFilter: '',
    })
      .setExecutionContext(sqlQueryParams.executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    this.createTabsForGroup(editorState, tabGroup, model);

    const mainTab = editorState.resultTabs.find(
      resultTab => resultTab.groupId === tabGroup.groupId && resultTab.indexInResultSet === 0
    );

    if (mainTab) {
      editorState.currentTabId = mainTab.tabId;
    }

    try {
      await model
        .setCountGain()
        .setSlice(0)
        .requestData();

      this.createTabsForGroup(editorState, tabGroup, model);

      const tabsToRemove = editorState.resultTabs
        .filter(
          resultTab => resultTab.groupId === tabGroup.groupId
            && resultTab.indexInResultSet >= model.source.results.length
        )
        .map(tab => tab.tabId);

      editorState.tabs = editorState.tabs
        .filter(resultTab => !tabsToRemove.includes(resultTab.id));
      editorState.resultTabs = editorState.resultTabs
        .filter(resultTab => !tabsToRemove.includes(resultTab.tabId));
    } catch (exception) {
      // remove first panel if execution was cancelled
      if (source.queryExecutionProcess?.getState() === EDeferredState.CANCELLED && isNewTabCreated) {
        this.removeGroup(editorState, tabGroup.groupId);
        const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
        this.notificationService.logException(exception, 'Query execution Error', message);
      }
    }
  }

  createGroup(
    params: ISqlQueryParams,
    tabState: ISqlEditorTabState,
    modelId: string
  ): IResultGroup {
    const order = Math.max(0, ...tabState.tabs.map(tab => tab.order + 1));
    const groupId = uuid();

    tabState.resultGroups.push({
      groupId,
      modelId,
      order,
      sqlQueryParams: params,
    });

    return tabState.resultGroups.find(group => group.groupId === groupId)!;
  }

  async getSubQuery(connectionId: string, query: string): Promise<string> {
    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      return query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    return query;
  }

  removeGroup(tabState: ISqlEditorTabState, groupId: string): void {
    const tabsToRemove = tabState.resultTabs.filter(tab => tab.groupId === groupId).map(tab => tab.tabId);

    tabState.tabs = tabState.tabs.filter(tab => !tabsToRemove.includes(tab.id));
    tabState.resultGroups = tabState.resultGroups.filter(group => group.groupId !== groupId);
    tabState.resultTabs = tabState.resultTabs.filter(tab => tab.groupId !== groupId);
    tabState.currentTabId = tabState.tabs[0]?.id;
  }

  removeResultTab(state: ISqlEditorTabState, tabId: string): void {
    const resultTab = state.resultTabs.find(resultTab => resultTab.tabId === tabId);
    const group = state.resultGroups.find(group => group.groupId === resultTab?.groupId);

    if (resultTab && group) {
      state.resultTabs.splice(state.resultTabs.indexOf(resultTab), 1);

      const isGroupEmpty = !state.resultTabs.some(resultTab => resultTab.groupId === group.groupId);

      if (isGroupEmpty) {
        state.resultGroups.splice(state.resultGroups.indexOf(group), 1);
        // TODO: probably we should cleanup some data before model delete
        this.tableViewerStorageService.remove(group.modelId);
      }
    }
  }

  private createTabsForGroup(
    state: ISqlEditorTabState,
    group: IResultGroup,
    model: DataModelWrapper
  ) {
    this.updateResultTab(model, state, group, 0);

    for (let i = 1; i < model.source.results.length; i++) {
      this.updateResultTab(model, state, group, i);
    }
  }

  private updateResultTab(
    model: DataModelWrapper,
    state: ISqlEditorTabState,
    group: IResultGroup,
    indexInResultSet: number,
  ) {
    const resultTab = state.resultTabs.find(
      tab => tab.groupId === group.groupId && tab.indexInResultSet === indexInResultSet
    );

    if (!resultTab) {
      this.createResultTab(state, group, indexInResultSet, model.source.results.length);
    } else {
      const tab = state.tabs.find(tab => tab.id === resultTab.tabId);

      if (tab) {
        tab.name = this.getTabNameForOrder(group.order, indexInResultSet, model.source.results.length);
      }
    }
  }

  private createResultTab(
    state: ISqlEditorTabState,
    group: IResultGroup,
    indexInResultSet: number,
    results: number
  ) {
    const id = uuid();

    state.resultTabs.push({
      tabId: id,
      groupId: group.groupId,
      indexInResultSet,
    });

    state.tabs.push({
      id,
      name: this.getTabNameForOrder(group.order, indexInResultSet, results),
      icon: '/icons/grid.png',
      order: group.order,
    });
  }

  private getTabNameForOrder(order: number, indexInResultSet: number, results: number) {
    return `Result - ${order + 1}` + (results > 1 ? ` (${indexInResultSet + 1})` : '');
  }
}
